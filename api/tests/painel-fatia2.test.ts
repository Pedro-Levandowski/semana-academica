import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M5 - Painel - Fatia 2 (Listagem de Atividades e Métricas)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia2-${Date.now()}-${Math.random()}.sqlite`);

    const painelQueryPort = {
      listarAtividades: () => [
        {
          id: 'act-encerrada',
          titulo: 'Atividade Encerrada',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-1', inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' }],
          inscricoes: [
            { participanteId: 'p-1', status: 'convocada' },
            { participanteId: 'p-2', status: 'cancelada' }
          ]
        },
        {
          id: 'act-andamento',
          titulo: 'Atividade Em Andamento',
          vagas: 3,
          cancelada: false,
          encontros: [
            { id: 'enc-2', inicio: '2026-10-21T10:00:00-03:00', fim: '2026-10-21T12:00:00-03:00' },
            { id: 'enc-2-anterior', inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T16:00:00-03:00' }
          ],
          inscricoes: [
            { participanteId: 'p-1', status: 'convocada' },
            { participanteId: 'p-2', status: 'convocada' },
            { participanteId: 'p-3', status: 'em_espera' },
            { participanteId: 'p-4', status: 'expirada' }
          ]
        },
        {
          id: 'act-vagas-6',
          titulo: 'Atividade Vagas 6',
          vagas: 6,
          cancelada: false,
          encontros: [{ id: 'enc-3', inicio: '2026-10-21T13:00:00-03:00', fim: '2026-10-21T14:00:00-03:00' }],
          inscricoes: [
            { participanteId: 'p-1', status: 'confirmada' }
          ]
        },
        {
          id: 'act-vagas-8',
          titulo: 'Atividade Vagas 8',
          vagas: 8,
          cancelada: false,
          encontros: [{ id: 'enc-4', inicio: '2026-10-21T13:30:00-02:00', fim: '2026-10-21T14:30:00-02:00' }],
          inscricoes: [
            { participanteId: 'p-1', status: 'confirmada' }
          ]
        },
        {
          id: 'act-beta',
          titulo: 'Beta Atividade',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-5', inicio: '2026-10-21T15:00:00-03:00', fim: '2026-10-21T16:00:00-03:00' }],
          inscricoes: []
        },
        {
          id: 'act-alfa-3',
          titulo: 'Alfa Atividade',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-6', inicio: '2026-10-21T15:00:00-03:00', fim: '2026-10-21T16:00:00-03:00' }],
          inscricoes: []
        },
        {
          id: 'act-alfa-1',
          titulo: 'Alfa Atividade',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-7', inicio: '2026-10-21T15:00:00-03:00', fim: '2026-10-21T16:00:00-03:00' }],
          inscricoes: []
        },
        {
          id: 'act-cancelada',
          titulo: 'Atividade Cancelada',
          vagas: 10,
          cancelada: true,
          encontros: [{ id: 'enc-8', inicio: '2026-10-21T16:00:00-03:00', fim: '2026-10-21T17:00:00-03:00' }],
          inscricoes: [{ participanteId: 'p-1', status: 'confirmada' }]
        }
      ]
    };

    app = createApp({ dbPath, modoTeste: true, painelQueryPort } as any);
    await request(app).post('/_teste/reset');
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-21T11:00:00-03:00' });
  });

  afterEach(() => {
    app?.close?.();
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {}
    }
  });

  it('lista atividades do painel com status corretos, contagens, ordenação e arredondamentos', async () => {
    const res = await request(app).get('/painel/atividades').set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        atividadeId: 'act-andamento',
        titulo: 'Atividade Em Andamento',
        vagas: 3,
        ocupadas: 2,
        emEspera: 1,
        ocupacaoPercentual: 66.7,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-encerrada',
        titulo: 'Atividade Encerrada',
        vagas: 10,
        ocupadas: 1,
        emEspera: 0,
        ocupacaoPercentual: 10,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-vagas-8',
        titulo: 'Atividade Vagas 8',
        vagas: 8,
        ocupadas: 1,
        emEspera: 0,
        ocupacaoPercentual: 12.5,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-vagas-6',
        titulo: 'Atividade Vagas 6',
        vagas: 6,
        ocupadas: 1,
        emEspera: 0,
        ocupacaoPercentual: 16.7,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-alfa-1',
        titulo: 'Alfa Atividade',
        vagas: 10,
        ocupadas: 0,
        emEspera: 0,
        ocupacaoPercentual: 0,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-alfa-3',
        titulo: 'Alfa Atividade',
        vagas: 10,
        ocupadas: 0,
        emEspera: 0,
        ocupacaoPercentual: 0,
        frequenciaPercentual: null
      },
      {
        atividadeId: 'act-beta',
        titulo: 'Beta Atividade',
        vagas: 10,
        ocupadas: 0,
        emEspera: 0,
        ocupacaoPercentual: 0,
        frequenciaPercentual: null
      }
    ]);
  });
});
