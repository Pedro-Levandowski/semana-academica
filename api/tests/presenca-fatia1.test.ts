import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M3 - Presença - Fatia 1 (R1)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-presenca-${Date.now()}-${Math.random()}.sqlite`);
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

  it('recusa GET /encontros/:id/codigo feito 16 minutos antes do início com 422 FORA_DA_JANELA', async () => {
    // Cria uma atividade com um encontro iniciando em 2026-10-19T10:00:00-03:00
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Teste Presença',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const encontroId = atividadeRes.body.encontros[0].id;

    // Define o relógio para 16 minutos antes do início (09:44:00-03:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:44:00-03:00' });

    // Tenta obter o código do encontro
    const res = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('FORA_DA_JANELA');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('permite GET /encontros/:id/codigo feito exatamente 15 minutos antes do início com 200 e objeto CodigoDoEncontro', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra 15m Antes',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const encontroId = atividadeRes.body.encontros[0].id;

    // Relógio em 09:45:00-03:00 (15 minutos antes)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:45:00-03:00' });

    const res = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    expect(res.body.encontroId).toBe(encontroId);
    expect(typeof res.body.codigo).toBe('string');
    expect(res.body.codigo.length).toBe(6);
    expect(typeof res.body.trocaEm).toBe('string');
    expect(typeof res.body.validoAte).toBe('string');
  });

  it('permite GET /encontros/:id/codigo feito exatamente 30 minutos depois do início com 200', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra 30m Depois',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const encontroId = atividadeRes.body.encontros[0].id;

    // Relógio em 10:30:00-03:00 (30 minutos depois)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:30:00-03:00' });

    const res = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    expect(res.body.encontroId).toBe(encontroId);
  });

  it('recusa GET /encontros/:id/codigo feito 31 minutos depois do início com 422 FORA_DA_JANELA', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra 31m Depois',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const encontroId = atividadeRes.body.encontros[0].id;

    // Relógio em 10:31:00-03:00 (31 minutos depois)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:31:00-03:00' });

    const res = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('FORA_DA_JANELA');
  });
});
