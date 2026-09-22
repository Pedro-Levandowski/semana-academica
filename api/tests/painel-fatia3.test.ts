import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M5 - Painel - Fatia 3 (Métricas de Frequência)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia3-${Date.now()}-${Math.random()}.sqlite`);

    const painelQueryPort = {
      listarAtividades: () => [
        {
          id: 'act-futura',
          titulo: 'Atividade Futura',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-f1', inicio: '2026-10-21T12:00:00-03:00', fim: '2026-10-21T14:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-1', status: 'confirmada' }
          ]
        },
        {
          id: 'act-sem-confirmados',
          titulo: 'Atividade Sem Confirmados',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-sc1', inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00', presencas: [{ participanteId: 'p-2' }] }
          ],
          inscricoes: [
            { participanteId: 'p-2', status: 'convocada' }
          ]
        },
        {
          id: 'act-seis-confirmados',
          titulo: 'Atividade Seis Confirmados',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-s1', inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T10:00:00-03:00', presencas: [{ participanteId: 'p-1' }, { participanteId: 'p-em-espera' }] }
          ],
          inscricoes: [
            { participanteId: 'p-1', status: 'confirmada' },
            { participanteId: 'p-2', status: 'confirmada' },
            { participanteId: 'p-3', status: 'confirmada' },
            { participanteId: 'p-4', status: 'confirmada' },
            { participanteId: 'p-5', status: 'confirmada' },
            { participanteId: 'p-6', status: 'confirmada' },
            { participanteId: 'p-em-espera', status: 'em_espera' }
          ]
        },
        {
          id: 'act-media-fronteira',
          titulo: 'Atividade Média Fronteira',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-m1', inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00', presencas: [{ participanteId: 'p-1' }] },
            { id: 'enc-m2', inicio: '2026-10-21T09:00:00-03:00', fim: '2026-10-21T11:00:00-03:00', presencas: [{ participanteId: 'p-1' }, { participanteId: 'p-2' }] },
            { id: 'enc-m3', inicio: '2026-10-21T12:00:00-03:00', fim: '2026-10-21T13:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-1', status: 'confirmada' },
            { participanteId: 'p-2', status: 'confirmada' }
          ]
        },
        {
          id: 'act-sem-chance',
          titulo: 'Atividade Sem Chance',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-sc-1', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00', presencas: [] },
            { id: 'enc-sc-2', inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00', presencas: [{ participanteId: 'p-uma-falta' }] },
            { id: 'enc-sc-3', inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00', presencas: [{ participanteId: 'p-ana-1' }, { participanteId: 'p-ana-2' }, { participanteId: 'p-zeta' }, { participanteId: 'p-uma-falta' }] },
            { id: 'enc-sc-4', inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00', presencas: [{ participanteId: 'p-ana-1' }, { participanteId: 'p-ana-2' }, { participanteId: 'p-zeta' }, { participanteId: 'p-uma-falta' }] }
          ],
          inscricoes: [
            { participanteId: 'p-ana-1', nome: 'Ana Igual', status: 'confirmada' },
            { participanteId: 'p-ana-2', nome: 'Ana Igual', status: 'confirmada' },
            { participanteId: 'p-zeta', nome: 'Zelda Fora', status: 'confirmada' },
            { participanteId: 'p-uma-falta', nome: 'Bruna Uma Falta', status: 'confirmada' },
            { participanteId: 'p-convocado', nome: 'Aarão Convocado', status: 'convocada' }
          ]
        },
        {
          id: 'act-limite-exato',
          titulo: 'Atividade Limite Exato',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-le-1', inicio: '2026-10-21T07:00:00-03:00', fim: '2026-10-21T09:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-falta', nome: 'Participante Falta', status: 'confirmada' }
          ]
        },
        {
          id: 'act-limite-depois',
          titulo: 'Atividade Limite Depois',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-ld-1', inicio: '2026-10-21T06:59:59-03:00', fim: '2026-10-21T08:59:59-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-falta', nome: 'Participante Falta', status: 'confirmada' }
          ]
        },
        {
          id: 'act-cancelada-sem-chance',
          titulo: 'Atividade Cancelada Sem Chance',
          vagas: 10,
          cancelada: true,
          encontros: [
            { id: 'enc-cs-1', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T09:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-canc', nome: 'Participante Cancelado', status: 'confirmada' }
          ]
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

  it('calcula frequenciaPercentual corretamente considerando encontros encerrados, confirmados e fronteira exata', async () => {
    const res = await request(app).get('/painel/atividades').set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    const body = res.body;

    const findAtividade = (id: string) => body.find((item: any) => item.atividadeId === id);

    expect(findAtividade('act-futura').frequenciaPercentual).toBeNull();
    expect(findAtividade('act-sem-confirmados').frequenciaPercentual).toBeNull();
    expect(findAtividade('act-seis-confirmados').frequenciaPercentual).toBe(16.7);
    expect(findAtividade('act-media-fronteira').frequenciaPercentual).toBe(75);
  });

  it('retorna participantes sem chance na rota /painel/atividades/:id/sem-chance considerando faltas, janela de 2h e ordenação por nome e id', async () => {
    // 1. act-sem-chance
    const resSemChance = await request(app).get('/painel/atividades/act-sem-chance/sem-chance').set('X-Usuario', 'org-ana');
    expect(resSemChance.status).toBe(200);
    expect(resSemChance.body).toEqual([
      {
        participanteId: 'p-ana-1',
        nome: 'Ana Igual',
        faltas: 2,
        faltasPermitidas: 1
      },
      {
        participanteId: 'p-ana-2',
        nome: 'Ana Igual',
        faltas: 2,
        faltasPermitidas: 1
      },
      {
        participanteId: 'p-zeta',
        nome: 'Zelda Fora',
        faltas: 2,
        faltasPermitidas: 1
      }
    ]);

    // 2. act-limite-exato (fim + 2h == relógio) -> ainda não atingiu o após 2h, retorna []
    const resLimiteExato = await request(app).get('/painel/atividades/act-limite-exato/sem-chance').set('X-Usuario', 'org-ana');
    expect(resLimiteExato.status).toBe(200);
    expect(resLimiteExato.body).toEqual([]);

    // 3. act-limite-depois (relogio > fim + 2h) -> retorna participante com falta
    const resLimiteDepois = await request(app).get('/painel/atividades/act-limite-depois/sem-chance').set('X-Usuario', 'org-ana');
    expect(resLimiteDepois.status).toBe(200);
    expect(resLimiteDepois.body).toEqual([
      {
        participanteId: 'p-falta',
        nome: 'Participante Falta',
        faltas: 1,
        faltasPermitidas: 0
      }
    ]);
  });

  it('retorna array vazio para atividade cancelada e 404 para atividade inexistente em /sem-chance', async () => {
    // 1. Atividade cancelada sem chance deve retornar []
    const resCancelada = await request(app).get('/painel/atividades/act-cancelada-sem-chance/sem-chance').set('X-Usuario', 'org-ana');
    expect(resCancelada.status).toBe(200);
    expect(resCancelada.body).toEqual([]);

    // 2. Atividade inexistente deve retornar 404 NAO_ENCONTRADO
    const resInexistente = await request(app).get('/painel/atividades/act-inexistente/sem-chance').set('X-Usuario', 'org-ana');
    expect(resInexistente.status).toBe(404);
    expect(resInexistente.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof resInexistente.body.mensagem).toBe('string');
    expect(resInexistente.body.mensagem.length).toBeGreaterThan(0);
  });
});
