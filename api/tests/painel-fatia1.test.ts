import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M5 - Painel - Fatia 1 (R1, R2 e Critérios 1 e 2)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia1-${Date.now()}-${Math.random()}.sqlite`);
    app = createApp({ dbPath, modoTeste: true });
    await request(app).post('/_teste/reset');
  });

  afterEach(() => {
    app?.close?.();
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {}
    }
  });

  it('exige autenticação X-Usuario válida (retornando 401 USUARIO_DESCONHECIDO) em todas as rotas do painel sem cabeçalho ou com usuário inexistente', async () => {
    const rotas = [
      { method: 'get', path: '/painel/atividades' },
      { method: 'get', path: '/painel/atividades/atv_inexistente/sem-chance' },
      { method: 'get', path: '/painel/atividades/atv_inexistente/frequencia.csv' },
      { method: 'get', path: '/painel/bloqueios' },
      { method: 'delete', path: '/painel/bloqueios/p-inexistente' }
    ];

    for (const rota of rotas) {
      // 1. Sem X-Usuario
      const resSemUsuario = await (request(app) as any)[rota.method](rota.path);
      expect(resSemUsuario.status).toBe(401);
      expect(resSemUsuario.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof resSemUsuario.body.mensagem).toBe('string');
      expect(resSemUsuario.body.mensagem.length).toBeGreaterThan(0);

      // 2. Com X-Usuario inexistente
      const resInexistente = await (request(app) as any)[rota.method](rota.path).set('X-Usuario', 'usuario-inexistente');
      expect(resInexistente.status).toBe(401);
      expect(resInexistente.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof resInexistente.body.mensagem).toBe('string');
      expect(resInexistente.body.mensagem.length).toBeGreaterThan(0);
    }
  });

  it('exige papel de organização (retornando 403 SOMENTE_ORGANIZACAO) em todas as rotas do painel quando o usuário autenticado não é da organização', async () => {
    const rotas = [
      { method: 'get', path: '/painel/atividades' },
      { method: 'get', path: '/painel/atividades/atv_inexistente/sem-chance' },
      { method: 'get', path: '/painel/atividades/atv_inexistente/frequencia.csv' },
      { method: 'get', path: '/painel/bloqueios' },
      { method: 'delete', path: '/painel/bloqueios/p-inexistente' }
    ];

    for (const rota of rotas) {
      const res = await (request(app) as any)[rota.method](rota.path).set('X-Usuario', 'p-carla');
      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('SOMENTE_ORGANIZACAO');
      expect(typeof res.body.mensagem).toBe('string');
      expect(res.body.mensagem.length).toBeGreaterThan(0);
    }
  });
});
