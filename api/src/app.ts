import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { createDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { runSeed, runReset } from './db/seed.js';
import { Clock, RealClock } from './clock/clock.js';
import { DatabaseControllableClock, ControllableClock } from './clock/controllable-clock.js';
import { NeutralM2Adapter } from './integrations/m2-port.js';
import { UserRepository } from './repositories/user-repository.js';
import { RoomRepository } from './repositories/room-repository.js';
import { ActivityRepository } from './repositories/activity-repository.js';

export interface AppOptions {
  dbPath?: string;
  clock?: Clock;
  modoTeste?: boolean;
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
  app.use(express.json());

  const db = createDatabase(dbPath);
  runMigrations(db);

  const clock = opts.clock || (modoTeste ? new DatabaseControllableClock(db) : new RealClock());

  if (modoTeste && !opts.clock && clock instanceof DatabaseControllableClock) {
    runSeed(db, clock);
  } else {
    runSeed(db);
  }

  const m2Port = new NeutralM2Adapter();
  const userRepository = new UserRepository(db);
  const roomRepository = new RoomRepository(db);
  const activityRepository = new ActivityRepository(db);

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

    app.put('/_teste/relogio', (req: Request, res: Response) => {
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

  app.get('/salas', requireUser, (_req: Request, res: Response) => {
    const salas = roomRepository.findAll();
    res.json(salas);
  });

  app.get('/atividades', requireUser, (_req: Request, res: Response) => {
    const atividades = activityRepository.findAll();
    const result = atividades.map((atv) => ({
      id: atv.id,
      titulo: atv.titulo,
      tipo: atv.tipo,
      salaId: atv.salaId,
      vagas: atv.vagas,
      cargaHorariaMinutos: atv.cargaHorariaMinutos,
      situacao: atv.cancelada ? 'cancelada' : 'prevista',
      ocupadas: m2Port.getOcupadas(atv.id),
      vagasRestantes: atv.vagas - m2Port.getOcupadas(atv.id),
      emEspera: m2Port.getEmEspera(atv.id),
      encontros: atv.encontros
    }));
    res.json(result);
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado' });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: err.message || 'Erro de validação' });
  });

  (app as any).close = () => {
    db.close();
  };

  return app;
}
