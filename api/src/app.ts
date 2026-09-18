import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { createDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { runSeed, runReset } from './db/seed.js';
import { Clock, RealClock } from './clock/clock.js';
import { DatabaseControllableClock, ControllableClock } from './clock/controllable-clock.js';
import { NeutralM2Adapter, SQLiteM2Adapter, M2IntegrationPort } from './integrations/m2-port.js';
import { UserRepository } from './repositories/user-repository.js';
import { RoomRepository } from './repositories/room-repository.js';
import { ActivityRepository } from './repositories/activity-repository.js';
import { InscricaoRepository } from './repositories/inscricao-repository.js';
import { PresencaRepository } from './repositories/presenca-repository.js';
import { CreateActivityUseCase } from './application/create-activity.js';
import { GetActivityUseCase } from './application/get-activity.js';
import { ListActivitiesUseCase } from './application/list-activities.js';
import { UpdateActivityUseCase } from './application/update-activity.js';
import { CancelActivityUseCase } from './application/cancel-activity.js';
import { GetCodigoDoEncontroUseCase } from './application/get-codigo-do-encontro.js';
import { RegisterPresencaUseCase } from './application/register-presenca.js';
import { RegisterPresencaManualUseCase } from './application/register-presenca-manual.js';
import { CreateInscricaoUseCase } from './application/create-inscricao.js';
import { NotFoundError } from './application/errors.js';
import { DomainError, ConflictError } from './domain/activity.js';
import { mapActivityResponse } from './http/activity-response.js';

export interface AppOptions {
  dbPath?: string;
  clock?: Clock;
  modoTeste?: boolean;
  m2Port?: M2IntegrationPort;
}

export function createApp(options?: AppOptions | string) {
  const opts: AppOptions = typeof options === 'string' ? { dbPath: options } : (options || {});
  const dbPath = opts.dbPath;
  const modoTeste = opts.modoTeste !== undefined ? opts.modoTeste : (process.env.MODO_TESTE === '1');

  const app = express();

  app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'X-Usuario']
  }));

  const db = createDatabase(dbPath);
  runMigrations(db);

  const clock = opts.clock || (modoTeste ? new DatabaseControllableClock(db) : new RealClock());

  if (modoTeste && !opts.clock && clock instanceof DatabaseControllableClock) {
    runSeed(db, clock);
  } else {
    runSeed(db);
  }

  const inscricaoRepository = new InscricaoRepository(db);
  const m2Port = opts.m2Port || new SQLiteM2Adapter(inscricaoRepository);
  const userRepository = new UserRepository(db);
  const roomRepository = new RoomRepository(db);
  const activityRepository = new ActivityRepository(db);
  const createActivityUseCase = new CreateActivityUseCase(activityRepository, roomRepository);
  const getActivityUseCase = new GetActivityUseCase(activityRepository);
  const listActivitiesUseCase = new ListActivitiesUseCase(activityRepository);
  const updateActivityUseCase = new UpdateActivityUseCase(activityRepository, roomRepository, m2Port);
  const cancelActivityUseCase = new CancelActivityUseCase(activityRepository, m2Port, clock);
  const getCodigoDoEncontroUseCase = new GetCodigoDoEncontroUseCase(activityRepository, clock);
  const presencaRepository = new PresencaRepository(db);
  const registerPresencaUseCase = new RegisterPresencaUseCase(activityRepository, inscricaoRepository, presencaRepository, clock);
  const registerPresencaManualUseCase = new RegisterPresencaManualUseCase(activityRepository, inscricaoRepository, presencaRepository, clock);
  const createInscricaoUseCase = new CreateInscricaoUseCase(activityRepository, inscricaoRepository, clock);

  // Modo de teste routes (when MODO_TESTE=1)
  if (modoTeste) {
    app.post('/_teste/reset', (_req: Request, res: Response) => {
      runReset(db, clock instanceof DatabaseControllableClock ? clock : undefined);
      res.status(204).send();
    });

    app.get('/_teste/relogio', (_req: Request, res: Response) => {
      const agoraStr = 'getIso' in clock ? (clock as ControllableClock).getIso() : clock.now().toISO() || '2026-10-13T09:00:00-03:00';
      res.json({ agora: agoraStr });
    });

    const isoSchema = z.string().datetime({ offset: true });

    app.put('/_teste/relogio', express.json(), (req: Request, res: Response) => {
      const { agora } = req.body || {};
      const result = isoSchema.safeParse(agora);
      if (!result.success) {
        res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Formato de data inválido. Deve ser ISO 8601 com fuso.' });
        return;
      }
      if ('set' in clock && typeof (clock as ControllableClock).set === 'function') {
        (clock as ControllableClock).set(result.data);
      }
      const agoraStr = 'getIso' in clock ? (clock as ControllableClock).getIso() : clock.now().toISO() || result.data;
      res.json({ agora: agoraStr });
    });
  } else {
    app.all('/_teste/*', (_req: Request, res: Response) => {
      res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Modo de teste desativado' });
    });
  }

  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.headers['x-usuario'] as string;
    if (!usuarioId) {
      res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Cabeçalho X-Usuario ausente' });
      return;
    }
    const user = userRepository.findById(usuarioId);
    if (!user) {
      res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário desconhecido' });
      return;
    }
    (req as any).user = user;
    next();
  };

  const requireOrg = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.papel !== 'organizacao') {
      res.status(403).json({ erro: 'SOMENTE_ORGANIZACAO', mensagem: 'Acesso restrito à organização' });
      return;
    }
    next();
  };

  const requireParticipant = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.papel !== 'participante') {
      res.status(403).json({ erro: 'SOMENTE_PARTICIPANTE', mensagem: 'Acesso restrito ao participante' });
      return;
    }
    next();
  };

  app.get('/salas', requireUser, (_req: Request, res: Response) => {
    const salas = roomRepository.findAll();
    res.json(salas);
  });

  app.get('/atividades', requireUser, (req: Request, res: Response) => {
    const agora = clock.now();
    const dia = typeof req.query.dia === 'string' ? req.query.dia : undefined;
    const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined;
    const atividades = listActivitiesUseCase.execute({ dia, tipo });
    const result = atividades.map((atv) => mapActivityResponse(atv, m2Port, agora));
    res.json(result);
  });

  app.get('/atividades/:id', requireUser, (req: Request, res: Response, next: NextFunction) => {
    try {
      const agora = clock.now();
      const activity = getActivityUseCase.execute(req.params.id);
      const result = mapActivityResponse(activity, m2Port, agora);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post('/atividades/:id/inscricoes', requireUser, requireParticipant, (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const inscricao = createInscricaoUseCase.execute(req.params.id, user.id);
      res.status(201).json(inscricao);
    } catch (err) {
      next(err);
    }
  });

  app.get('/inscricoes', requireUser, (req: Request, res: Response) => {
    const user = (req as any).user;
    const atividadeId = typeof req.query.atividadeId === 'string' ? req.query.atividadeId : undefined;
    if (user.papel === 'participante') {
      const list = inscricaoRepository.findByParticipant(user.id, atividadeId);
      res.json(list);
    } else {
      const list = inscricaoRepository.findAll(atividadeId);
      res.json(list);
    }
  });

  app.get('/inscricoes/:id', requireUser, (req: Request, res: Response) => {
    const user = (req as any).user;
    const inscricao = inscricaoRepository.findById(req.params.id);
    if (!inscricao) {
      res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada' });
      return;
    }
    if (user.papel === 'participante' && inscricao.participanteId !== user.id) {
      res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Inscrição não encontrada' });
      return;
    }
    res.json(inscricao);
  });

  app.get('/encontros/:id/codigo', requireUser, requireOrg, (req: Request, res: Response, next: NextFunction) => {
    try {
      const codigoDoEncontro = getCodigoDoEncontroUseCase.execute(req.params.id);
      res.json(codigoDoEncontro);
    } catch (err) {
      next(err);
    }
  });

  const registerPresencaSchema = z.object({
    codigo: z.string(),
    lidoEm: z.string().optional()
  });

  app.post('/encontros/:id/presencas', requireUser, requireParticipant, express.json(), (req: Request, res: Response, next: NextFunction) => {
    const parseResult = registerPresencaSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Dados inválidos' });
      return;
    }

    try {
      const user = (req as any).user;
      const { presenca, statusCode } = registerPresencaUseCase.execute(req.params.id, user.id, parseResult.data);
      res.status(statusCode).json(presenca);
    } catch (err) {
      next(err);
    }
  });

  const registerPresencaManualSchema = z.object({
    participanteId: z.string(),
    justificativa: z.string().optional()
  });

  app.post('/encontros/:id/presencas/manual', requireUser, requireOrg, express.json(), (req: Request, res: Response, next: NextFunction) => {
    const parseResult = registerPresencaManualSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Dados inválidos' });
      return;
    }

    try {
      const { participanteId, justificativa } = parseResult.data;
      const { presenca, statusCode } = registerPresencaManualUseCase.execute(req.params.id, participanteId, { participanteId, justificativa });
      res.status(statusCode).json(presenca);
    } catch (err) {
      next(err);
    }
  });

  const createActivitySchema = z.object({
    titulo: z.string(),
    tipo: z.enum(['palestra', 'minicurso']),
    salaId: z.string(),
    vagas: z.number().int(),
    encontros: z.array(
      z.object({
        inicio: z.string(),
        fim: z.string()
      })
    )
  });

  app.post('/atividades', requireUser, requireOrg, express.json(), (req: Request, res: Response, next: NextFunction) => {
    const parseResult = createActivitySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Dados inválidos' });
      return;
    }

    try {
      const agora = clock.now();
      const created = createActivityUseCase.execute(parseResult.data);
      const result = mapActivityResponse(created, m2Port, agora);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  const updateActivitySchema = z.object({
    titulo: z.string().optional(),
    vagas: z.number().int().optional(),
    tipo: z.any().optional(),
    salaId: z.any().optional(),
    encontros: z.any().optional(),
    cargaHorariaMinutos: z.any().optional()
  });

  const jsonParser = express.json();

  app.patch('/atividades/:id', requireUser, requireOrg, (req: Request, res: Response, next: NextFunction) => {
    const activityId = req.params.id;
    try {
      getActivityUseCase.execute(activityId);
    } catch (err) {
      next(err);
      return;
    }

    jsonParser(req, res, (err?: any) => {
      if (err) {
        res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'JSON malformado' });
        return;
      }

      const parseResult = updateActivitySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Dados inválidos' });
        return;
      }

      try {
        const agora = clock.now();
        const updated = updateActivityUseCase.execute(activityId, parseResult.data);
        const result = mapActivityResponse(updated, m2Port, agora);
        res.json(result);
      } catch (e) {
        next(e);
      }
    });
  });

  app.post('/atividades/:id/cancelamento', requireUser, requireOrg, (req: Request, res: Response, next: NextFunction) => {
    try {
      const agora = clock.now();
      const activityId = req.params.id;
      const updated = cancelActivityUseCase.execute(activityId);
      const result = mapActivityResponse(updated, m2Port, agora);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado' });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'JSON malformado' });
      return;
    }
    if (err instanceof ConflictError || err.code === 'CONFLITO_DE_SALA' || err.code === 'JA_INSCRITO' || err.code === 'CONFLITO_DE_HORARIO') {
      res.status(409).json({ erro: err.code || 'CONFLITO_DE_SALA', mensagem: err.message });
      return;
    }
    if (err instanceof DomainError) {
      if (err.code === 'NAO_INSCRITO') {
        res.status(403).json({ erro: err.code, mensagem: err.message });
        return;
      }
      res.status(422).json({ erro: err.code, mensagem: err.message });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: err.message });
      return;
    }
    res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: err.message || 'Erro de validação' });
  });

  (app as any).close = () => {
    db.close();
  };

  return app;
}