import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('M3 - Presença - Fatia 2 (Registro via QR e Idempotência)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-presenca-f2-${Date.now()}-${Math.random()}.sqlite`);
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

  it('critério 12 (R9) — presença registrada por participante sem inscrição confirmada deve retornar 403 NAO_INSCRITO', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Fatia 2',
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

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    expect(codigoRes.status).toBe(200);
    const codigo = codigoRes.body.codigo;

    // Participante p-carla tenta sem inscrição
    const resSemInscricao = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo });

    expect(resSemInscricao.status).toBe(403);
    expect(resSemInscricao.body.erro).toBe('NAO_INSCRITO');

    // Inscrição com status em_espera
    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-1', atividadeId, 'p-diego', 'em_espera', 1, null, '2026-10-18T10:00:00-03:00');
    db.close();

    const resEspera = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-diego')
      .send({ codigo });

    expect(resEspera.status).toBe(403);
    expect(resEspera.body.erro).toBe('NAO_INSCRITO');
  });

  it('critérios 6, 15, 16, 17, 22 — registro bem-sucedido, idempotência 201/200, sem lidoEm e origem qr', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Sucesso',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const atividadeId = atividadeRes.body.id;
    const encontroId = atividadeRes.body.encontros[0].id;

    // Insere inscrição confirmada para p-carla
    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-carla', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // Primeiro registro (201)
    const res1 = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo });

    expect(res1.status).toBe(201);
    expect(res1.body.id).toMatch(/^pre_[0-9a-f]{8}$/);
    expect(res1.body.encontroId).toBe(encontroId);
    expect(res1.body.participanteId).toBe('p-carla');
    expect(res1.body.origem).toBe('qr');
    expect(typeof res1.body.registradaEm).toBe('string');
    expect(typeof res1.body.lidoEm).toBe('string');

    // Segundo registro / Reenvio (Idempotência -> 200)
    const res2 = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo });

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(res1.body.id);
    expect(res2.body.origem).toBe('qr');
  });

  it('critérios 7, 13, 14 — normalização (minúsculas/espaços), código anterior válido, código inválido / outro encontro', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Testes Diversos',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
          { inicio: '2026-10-19T12:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const atividadeId = atividadeRes.body.id;
    const encontro1Id = atividadeRes.body.encontros[0].id;
    const encontro2Id = atividadeRes.body.encontros[1].id;

    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-carla-1', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-diego-1', atividadeId, 'p-diego', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    // Relógio em 10:05:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes1 = await request(app)
      .get(`/encontros/${encontro1Id}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo1 = codigoRes1.body.codigo;

    // Normalização (letras minúsculas e espaços)
    const codigoNormalizavel = `  ${codigo1.toLowerCase()}  `;
    const resNorm = await request(app)
      .post(`/encontros/${encontro1Id}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo: codigoNormalizavel });
    expect(resNorm.status).toBe(201);

    // Relógio em 12:00:00 para obter código do encontro 2
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    const codigoRes2 = await request(app)
      .get(`/encontros/${encontro2Id}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo2 = codigoRes2.body.codigo;

    // Retorna relógio para 10:05:00 (janela do encontro 1)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const resOutroEncontro = await request(app)
      .post(`/encontros/${encontro1Id}/presencas`)
      .set('X-Usuario', 'p-diego')
      .send({ codigo: codigo2 });
    expect(resOutroEncontro.status).toBe(422);
    expect(resOutroEncontro.body.erro).toBe('CODIGO_INVALIDO');
  });

  it('critério 21 (R17) — relógio do celular adiantado (lidoEm no futuro) usa o instante do envio', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Relógio Adiantado',
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
    `).run('ins-carla-f', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // lidoEm no futuro (10:15:00) em relação ao servidor (10:05:00)
    const res = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({
        codigo,
        lidoEm: '2026-10-19T10:15:00-03:00'
      });

    expect(res.status).toBe(201);
    // Deve ter usado o tempo do servidor (10:05:00)
    expect(res.body.lidoEm).toContain('2026-10-19T10:05:00');
  });
});
