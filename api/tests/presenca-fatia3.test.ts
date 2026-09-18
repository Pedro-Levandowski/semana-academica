import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('M3 - Presença - Fatia 3 (Offline e Sincronização Tardia)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-presenca-f3-${Date.now()}-${Math.random()}.sqlite`);
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

  it('critério 8 (R5) — envio com lidoEm correspondente a 2 horas e 1 minute após o fim do encontro deve retornar 422 SINCRONIZACAO_TARDIA', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Sincronizacao Tardia',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const atividadeId = atividadeRes.body.id;
    const encontroId = atividadeRes.body.encontros[0].id;

    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-carla', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    // Obter código gerado durante a janela normal (ex: 10:05)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // Fim do encontro: 11:00:00-03:00. 2 horas depois = 13:00:00. 2h1min = 13:01:00-03:00.
    // O envio é feito agora (servidor em 13:02:00), mas lidoEm é 13:01:00 (2h1min pós fim).
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T13:02:00-03:00' });

    const resTardia = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({
        codigo,
        lidoEm: '2026-10-19T13:01:00-03:00'
      });

    expect(resTardia.status).toBe(422);
    expect(resTardia.body.erro).toBe('SINCRONIZACAO_TARDIA');
  });

  it('critério 8 e 22 (R5, R18) — envio com lidoEm dentro do limite de 2 horas pós fim é aceito com origem qr_offline', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Sincronizacao Valida',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const atividadeId = atividadeRes.body.id;
    const encontroId = atividadeRes.body.encontros[0].id;

    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-carla-2', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // Servidor em 12:00:00 (1h após fim de 11:00, dentro das 2h), lidoEm em 10:05:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    const resValida = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({
        codigo,
        lidoEm: '2026-10-19T10:05:00-03:00'
      });

    expect(resValida.status).toBe(201);
    expect(resValida.body.origem).toBe('qr_offline');
    expect(resValida.body.lidoEm).toContain('2026-10-19T10:05:00');
  });
});
