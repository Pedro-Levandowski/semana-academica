import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { runSeed } from './db/seed.js';
import { NeutralM2Adapter } from './integrations/m2-port.js';

export function createApp(dbPath?: string) {
  const app = express();

  app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'X-Usuario']
  }));
  app.use(express.json());

  const db = createDatabase(dbPath);
  runMigrations(db);
  runSeed(db);

  const m2Port = new NeutralM2Adapter();

  // Modo de teste routes (when MODO_TESTE=1)
  if (process.env.MODO_TESTE === '1') {
    app.post('/_teste/reset', (_req: Request, res: Response) => {
      runSeed(db);
      res.status(204).send();
    });

    app.get('/_teste/relogio', (_req: Request, res: Response) => {
      const row = db.prepare('SELECT agora FROM relogio_estado WHERE id = 1').get() as { agora: string };
      res.json({ agora: row ? row.agora : '2026-10-13T09:00:00-03:00' });
    });

    app.put('/_teste/relogio', (req: Request, res: Response) => {
      const { agora } = req.body;
      if (!agora) {
        res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: 'Campo agora é obrigatório' });
        return;
      }
      db.prepare('UPDATE relogio_estado SET agora = ? WHERE id = 1').run(agora);
      res.json({ agora });
    });
  } else {
    app.all('/_teste/*', (_req: Request, res: Response) => {
      res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Modo de teste desativado' });
    });
  }

  // Middleware de autenticação X-Usuario para rotas protegidas (exceto /_teste/* e GET /certificados/:codigo)
  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.headers['x-usuario'] as string;
    if (!usuarioId) {
      res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Cabeçalho X-Usuario ausente' });
      return;
    }
    const user = db.prepare('SELECT id, nome, papel FROM usuarios WHERE id = ?').get(usuarioId);
    if (!user) {
      res.status(401).json({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário desconhecido' });
      return;
    }
    (req as any).user = user;
    next();
  };

  // GET /salas (todos)
  app.get('/salas', (_req: Request, res: Response) => {
    const salas = db.prepare('SELECT id, nome, capacidade FROM salas').all();
    res.json(salas);
  });

  // GET /atividades (todos)
  app.get('/atividades', (_req: Request, res: Response) => {
    const atividades = db.prepare('SELECT id, titulo, tipo, sala_id as salaId, vagas, carga_horaria_minutos as cargaHorariaMinutos, situacao FROM atividades').all();
    const result = atividades.map((atv: any) => ({
      ...atv,
      ocupadas: m2Port.getOcupadas(atv.id),
      vagasRestantes: atv.vagas - m2Port.getOcupadas(atv.id),
      emEspera: m2Port.getEmEspera(atv.id),
      encontros: db.prepare('SELECT id, inicio, fim FROM encontros WHERE atividade_id = ?').all(atv.id)
    }));
    res.json(result);
  });

  // 404 handler for unknown routes adhering to contract error format
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado' });
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(422).json({ erro: 'DADOS_INVALIDOS', mensagem: err.message || 'Erro de validação' });
  });

  return app;
}
