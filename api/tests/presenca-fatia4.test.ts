import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('M3 - Presença - Fatia 4 (Presença Manual e Limites)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-presenca-f4-${Date.now()}-${Math.random()}.sqlite`);
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

  it('critério 9 (R6) — tentativa de presença manual sem justificativa ou com menos de 10 caracteres deve retornar 422 JUSTIFICATIVA_OBRIGATORIA', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Manual',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const encontroId = atividadeRes.body.encontros[0].id;

    // Sem justificativa
    const resSem = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla'
      });

    expect(resSem.status).toBe(422);
    expect(resSem.body.erro).toBe('JUSTIFICATIVA_OBRIGATORIA');

    // Com justificativa curta (< 10 caracteres)
    const resCurta = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Falta luz'
      });

    expect(resCurta.status).toBe(422);
    expect(resCurta.body.erro).toBe('JUSTIFICATIVA_OBRIGATORIA');
  });

  it('critério 10 (R7) — tentativa de presença manual fora do período permitido (antes da janela ou mais de 2h após o fim) deve retornar 422 FORA_DA_JANELA', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Janela Manual',
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
    `).run('ins-carla-f4', atividadeId, 'p-carla', 'confirmada', null, null, '2026-10-18T10:00:00-03:00');
    db.close();

    // Antes da janela (encontro 10:00, janela inicia 09:45. Testar em 09:44:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:44:00-03:00' });

    const resAntes = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Participou presencialmente mas esqueceu cracha'
      });

    expect(resAntes.status).toBe(422);
    expect(resAntes.body.erro).toBe('FORA_DA_JANELA');

    // Depois de 2h do fim (fim 11:00, limite 13:00. Testar em 13:01:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T13:01:00-03:00' });

    const resDepois = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Participou presencialmente mas esqueceu cracha'
      });

    expect(resDepois.status).toBe(422);
    expect(resDepois.body.erro).toBe('FORA_DA_JANELA');
  });

  it('critério 12 (R9) e R15 — presença manual para participante sem inscrição confirmada deve retornar 403 NAO_INSCRITO', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Nao Inscrito Manual',
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

    const res = await request(app)
      .post(`/encontros/${encontroId}/presencas/manual`)
      .set('X-Usuario', 'org-ana')
      .send({
        participanteId: 'p-carla',
        justificativa: 'Participou presencialmente mas esqueceu cracha'
      });

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('NAO_INSCRITO');
  });
});
