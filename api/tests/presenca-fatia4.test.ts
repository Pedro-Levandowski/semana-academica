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
});
