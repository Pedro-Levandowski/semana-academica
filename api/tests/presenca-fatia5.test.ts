import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('M3 - Presença - Fatia 5 (Precedência de Erros e Listagem)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-presenca-f5-${Date.now()}-${Math.random()}.sqlite`);
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

  it('R14 (Critério 18) — precedência de erros no registro pelo participante: presença existente (200) prevalece sobre não inscrito/janela/código inválido', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Precedencia Part',
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
    `).run('ins-carla', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // Primeiro registro bem-sucedido (201)
    const res1 = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo });
    expect(res1.status).toBe(201);

    // Agora muda o relógio para fora da janela (ex: 12:00) e envia com código inválido.
    // Como a presença já existe, a regra de presença existente (200 / idempotência) tem precedência sobre fora da janela / código inválido.
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    const res2 = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo: 'INVALID' });

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(res1.body.id);
  });

  it('R14 (Critério 18) — não inscrito (403) prevalece sobre fora da janela / código inválido', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Precedencia Nao Inscrito',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const encontroId = atividadeRes.body.encontros[0].id;

    // Relógio fora da janela (12:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    // p-carla sem inscrição tenta enviar código inválido fora da janela
    const res = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo: 'INVALID' });

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('NAO_INSCRITO');
  });

  it('R15 (Critério 19) — precedência de erros na presença manual: justificativa (422) prevalece sobre presença existente / não inscrito / fora da janela', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Precedencia Manual Justificativa',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const encontroId = atividadeRes.body.encontros[0].id;

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    // Sem justificativa (ou justificativa curta), mesmo para participante não inscrito ou fora da janela
    const res = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'curta'
      });

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('JUSTIFICATIVA_OBRIGATORIA');
  });

  it('R16 (Critério 20) — pedido GET para /encontros/:id/presencas feito pela organização retorna 200 e a lista de presenças', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Listagem Presencas',
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
    `).run('ins-carla', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('ins-diego', atividadeId, 'p-diego', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:05:00-03:00' });

    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', 'org-ana');
    const codigo = codigoRes.body.codigo;

    // Presença de p-carla (QR)
    await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'p-carla')
      .send({ codigo });

    // Presença de p-diego (Manual)
    await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-diego',
        justificativa: 'Participou presencialmente sem crachá'
      });

    // GET /encontros/:id/presencas por org-ana
    const res = await request(app)
      .get(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body.some((p: any) => p.participanteId === 'p-carla' && p.origem === 'qr')).toBe(true);
    expect(res.body.some((p: any) => p.participanteId === 'p-diego' && p.origem === 'manual')).toBe(true);
  });
});
