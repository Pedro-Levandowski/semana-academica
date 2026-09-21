import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { DateTime } from 'luxon';
import { createApp } from '../src/app.js';

describe('M5 - Painel - Fatia 5 (Formação e Listagem de Bloqueios - R14, R15)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia5-${Date.now()}-${Math.random()}.sqlite`);

    const painelQueryPort = {
      listarAtividades: () => [
        {
          id: 'act-a-empate-1',
          titulo: 'Atividade A Empate',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-a1', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T11:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-ana', nome: 'Ana Souza', status: 'confirmada' }
          ]
        },
        {
          id: 'act-b-empate-2',
          titulo: 'Atividade B Empate',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-b2', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T11:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-ana', nome: 'Ana Souza', status: 'confirmada' }
          ]
        },
        {
          id: 'act-extra',
          titulo: 'Atividade Extra',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-ex', inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-ana', nome: 'Ana Souza', status: 'confirmada' }
          ]
        },
        {
          id: 'act-carlos-1',
          titulo: 'Atividade Carlos 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-c1', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-carlos-a', nome: 'Carlos Silva', status: 'confirmada' },
            { participanteId: 'p-carlos-b', nome: 'Carlos Silva', status: 'confirmada' }
          ]
        },
        {
          id: 'act-carlos-2',
          titulo: 'Atividade Carlos 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-c2', inicio: '2026-10-17T08:00:00-03:00', fim: '2026-10-17T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-carlos-a', nome: 'Carlos Silva', status: 'confirmada' },
            { participanteId: 'p-carlos-b', nome: 'Carlos Silva', status: 'confirmada' }
          ]
        },
        {
          id: 'act-zilda-1',
          titulo: 'Atividade Zilda 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-z1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-zilda', nome: 'Zilda Ramos', status: 'confirmada' }
          ]
        },
        {
          id: 'act-zilda-2',
          titulo: 'Atividade Zilda 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-z2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-zilda', nome: 'Zilda Ramos', status: 'confirmada' }
          ]
        },
        {
          id: 'act-um',
          titulo: 'Atividade Um',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-um', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-um-enc', nome: 'João Um', status: 'confirmada' }
          ]
        },
        {
          id: 'act-misto-1',
          titulo: 'Atividade Misto 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-m1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-misto', nome: 'Maria Misto', status: 'confirmada' }
          ]
        },
        {
          id: 'act-misto-2',
          titulo: 'Atividade Misto 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-m2-1', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] },
            { id: 'enc-m2-2', inicio: '2026-10-25T08:00:00-03:00', fim: '2026-10-25T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-misto', nome: 'Maria Misto', status: 'confirmada' }
          ]
        },
        {
          id: 'act-canc-1',
          titulo: 'Atividade Canc 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-cn1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-canc', nome: 'Pedro Cancelada', status: 'confirmada' }
          ]
        },
        {
          id: 'act-canc-2',
          titulo: 'Atividade Canc 2',
          vagas: 10,
          cancelada: true,
          encontros: [
            { id: 'enc-cn2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-canc', nome: 'Pedro Cancelada', status: 'confirmada' }
          ]
        },
        {
          id: 'act-fut-1',
          titulo: 'Atividade Fut 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-ft1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-fut', nome: 'Paula Futura', status: 'confirmada' }
          ]
        },
        {
          id: 'act-fut-2',
          titulo: 'Atividade Fut 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-ft2', inicio: '2026-10-25T08:00:00-03:00', fim: '2026-10-25T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-fut', nome: 'Paula Futura', status: 'confirmada' }
          ]
        },
        {
          id: 'act-pres-1',
          titulo: 'Atividade Pres 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-pr1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-pres', nome: 'Lucas Presenca', status: 'confirmada' }
          ]
        },
        {
          id: 'act-pres-2',
          titulo: 'Atividade Pres 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-pr2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [{ participanteId: 'p-pres' }] }
          ],
          inscricoes: [
            { participanteId: 'p-pres', nome: 'Lucas Presenca', status: 'confirmada' }
          ]
        },
        {
          id: 'act-nc-1',
          titulo: 'Atividade NC 1',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-nc1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-conv', nome: 'Convocal', status: 'convocada' },
            { participanteId: 'p-espera', nome: 'Espera', status: 'em_espera' },
            { participanteId: 'p-insc-canc', nome: 'InscCanc', status: 'cancelada' },
            { participanteId: 'p-exp', nome: 'Expirada', status: 'expirada' }
          ]
        },
        {
          id: 'act-nc-2',
          titulo: 'Atividade NC 2',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-nc2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-conv', nome: 'Convocal', status: 'convocada' },
            { participanteId: 'p-espera', nome: 'Espera', status: 'em_espera' },
            { participanteId: 'p-insc-canc', nome: 'InscCanc', status: 'cancelada' },
            { participanteId: 'p-exp', nome: 'Expirada', status: 'expirada' }
          ]
        }
      ]
    };

    app = createApp({ dbPath, modoTeste: true, painelQueryPort } as any);
    await request(app).post('/_teste/reset');
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-22T11:00:00-03:00' });
  });

  afterEach(() => {
    app?.close?.();
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {}
    }
  });

  it('forma bloqueios corretamente aplicando regras R14 e R15 (ordenação, exclusão de não confirmadas, presença, canceladas, futuras, limite de 2, desempate por atividadeId e bloqueadoDesde)', async () => {
    const res = await request(app)
      .get('/painel/bloqueios')
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    const bloqueios = res.body;
    expect(Array.isArray(bloqueios)).toBe(true);
    expect(bloqueios.length).toBe(4);

    const expectedBlocked = [
      {
        participanteId: 'p-ana',
        nome: 'Ana Souza',
        atividades: ['act-a-empate-1', 'act-b-empate-2'],
        bloqueadoDesde: DateTime.fromISO('2026-10-19T11:00:00-03:00', { setZone: true })
      },
      {
        participanteId: 'p-carlos-a',
        nome: 'Carlos Silva',
        atividades: ['act-carlos-1', 'act-carlos-2'],
        bloqueadoDesde: DateTime.fromISO('2026-10-17T10:00:00-03:00', { setZone: true })
      },
      {
        participanteId: 'p-carlos-b',
        nome: 'Carlos Silva',
        atividades: ['act-carlos-1', 'act-carlos-2'],
        bloqueadoDesde: DateTime.fromISO('2026-10-17T10:00:00-03:00', { setZone: true })
      },
      {
        participanteId: 'p-zilda',
        nome: 'Zilda Ramos',
        atividades: ['act-zilda-1', 'act-zilda-2'],
        bloqueadoDesde: DateTime.fromISO('2026-10-16T10:00:00-03:00', { setZone: true })
      }
    ];

    bloqueios.forEach((b: any, index: number) => {
      expect(Object.keys(b).sort()).toEqual(['atividades', 'bloqueadoDesde', 'nome', 'participanteId'].sort());
      expect(b.participanteId).toBe(expectedBlocked[index].participanteId);
      expect(b.nome).toBe(expectedBlocked[index].nome);
      expect(b.atividades).toEqual(expectedBlocked[index].atividades);

      expect(typeof b.bloqueadoDesde).toBe('string');
      const dt = DateTime.fromISO(b.bloqueadoDesde, { setZone: true });
      expect(dt.isValid).toBe(true);
      expect(dt.toMillis()).toBe(expectedBlocked[index].bloqueadoDesde.toMillis());
    });
  });

  it('retorna lista vazia quando nenhum participante atinge o critério de bloqueio', async () => {
    const painelQueryPortVazio = {
      listarAtividades: () => [
        {
          id: 'act-ok',
          titulo: 'Atividade OK',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-ok', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [{ participanteId: 'p-ok' }] }
          ],
          inscricoes: [
            { participanteId: 'p-ok', nome: 'Participante OK', status: 'confirmada' }
          ]
        }
      ]
    };

    const appVazio: any = createApp({ dbPath, modoTeste: true, painelQueryPort: painelQueryPortVazio } as any);
    await request(appVazio).post('/_teste/reset');
    await request(appVazio).put('/_teste/relogio').send({ agora: '2026-10-22T11:00:00-03:00' });

    const res = await request(appVazio)
      .get('/painel/bloqueios')
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    appVazio?.close?.();
  });

  it('gerencia remoção de bloqueio, persistência do desbloqueio, 404 para participantes não bloqueados e reincidência com base exclusivamente em atividades posteriores ao desbloqueio (R16)', async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia5-r16-${Date.now()}-${Math.random()}.sqlite`);

    const atividadesList: any[] = [
      {
        id: 'act-1',
        titulo: 'Atividade 1',
        vagas: 10,
        cancelada: false,
        encontros: [{ id: 'enc-1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }],
        inscricoes: [{ participanteId: 'p-1', nome: 'Participante Um', status: 'confirmada' }]
      },
      {
        id: 'act-2',
        titulo: 'Atividade 2',
        vagas: 10,
        cancelada: false,
        encontros: [{ id: 'enc-2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }],
        inscricoes: [{ participanteId: 'p-1', nome: 'Participante Um', status: 'confirmada' }]
      }
    ];

    const painelQueryPort = {
      listarAtividades: () => atividadesList
    };

    let appR16: any = createApp({ dbPath, modoTeste: true, painelQueryPort });

    try {
      await request(appR16).post('/_teste/reset');
      await request(appR16).put('/_teste/relogio').send({ agora: '2026-10-17T11:00:00-03:00' });

      const resInitial = await request(appR16)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resInitial.status).toBe(200);
      expect(resInitial.body.length).toBe(1);
      expect(resInitial.body[0].participanteId).toBe('p-1');

      const copiaAtividades = JSON.parse(JSON.stringify(atividadesList));

      const instantDesbloqueioStr = '2026-10-17T12:00:00-03:00';
      await request(appR16).put('/_teste/relogio').send({ agora: instantDesbloqueioStr });

      const resDel = await request(appR16)
        .delete('/painel/bloqueios/p-1')
        .set('X-Usuario', 'org-ana');

      expect(resDel.status).toBe(204);
      expect(resDel.text).toBe('');

      expect(atividadesList).toEqual(copiaAtividades);

      const resGet1 = await request(appR16)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resGet1.status).toBe(200);
      expect(resGet1.body).toEqual([]);

      appR16?.close?.();
      appR16 = createApp({ dbPath, modoTeste: true, painelQueryPort }) as any;

      const resGet2 = await request(appR16)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resGet2.status).toBe(200);
      expect(resGet2.body).toEqual([]);

      const resDelAgain = await request(appR16)
        .delete('/painel/bloqueios/p-1')
        .set('X-Usuario', 'org-ana');
      expect(resDelAgain.status).toBe(404);
      expect(resDelAgain.body.erro).toBe('NAO_ENCONTRADO');
      expect(typeof resDelAgain.body.mensagem).toBe('string');
      expect(resDelAgain.body.mensagem.length).toBeGreaterThan(0);

      const resDelNunca = await request(appR16)
        .delete('/painel/bloqueios/p-nunca-bloqueado')
        .set('X-Usuario', 'org-ana');
      expect(resDelNunca.status).toBe(404);
      expect(resDelNunca.body.erro).toBe('NAO_ENCONTRADO');
      expect(typeof resDelNunca.body.mensagem).toBe('string');
      expect(resDelNunca.body.mensagem.length).toBeGreaterThan(0);

      atividadesList.push({
        id: 'act-unlock-exact',
        titulo: 'Atividade Exata Desbloqueio',
        vagas: 10,
        cancelada: false,
        encontros: [{ id: 'enc-ue', inicio: '2026-10-17T10:00:00-03:00', fim: instantDesbloqueioStr, presencas: [] }],
        inscricoes: [{ participanteId: 'p-1', nome: 'Participante Um', status: 'confirmada' }]
      });

      atividadesList.push({
        id: 'act-pos-1',
        titulo: 'Atividade Pos 1',
        vagas: 10,
        cancelada: false,
        encontros: [{ id: 'enc-p1', inicio: '2026-10-18T08:00:00-03:00', fim: '2026-10-18T10:00:00-03:00', presencas: [] }],
        inscricoes: [{ participanteId: 'p-1', nome: 'Participante Um', status: 'confirmada' }]
      });

      await request(appR16).put('/_teste/relogio').send({ agora: '2026-10-19T00:00:00-03:00' });
      const resGet3 = await request(appR16)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resGet3.status).toBe(200);
      expect(resGet3.body).toEqual([]);

      atividadesList.push({
        id: 'act-pos-2',
        titulo: 'Atividade Pos 2',
        vagas: 10,
        cancelada: false,
        encontros: [{ id: 'enc-p2', inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T10:00:00-03:00', presencas: [] }],
        inscricoes: [{ participanteId: 'p-1', nome: 'Participante Um', status: 'confirmada' }]
      });

      await request(appR16).put('/_teste/relogio').send({ agora: '2026-10-21T00:00:00-03:00' });

      const resGet4 = await request(appR16)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resGet4.status).toBe(200);
      expect(resGet4.body.length).toBe(1);
      const bloqueioNovo = resGet4.body[0];

      expect(bloqueioNovo.participanteId).toBe('p-1');
      expect(bloqueioNovo.atividades).toEqual(['act-pos-1', 'act-pos-2']);

      const dtBloqueio = DateTime.fromISO(bloqueioNovo.bloqueadoDesde, { setZone: true });
      const dtFimPos2 = DateTime.fromISO('2026-10-20T10:00:00-03:00', { setZone: true });
      expect(dtBloqueio.isValid).toBe(true);
      expect(dtBloqueio.toMillis()).toBe(dtFimPos2.toMillis());

      expect(bloqueioNovo.nome).toBe('Participante Um');
    } finally {
      appR16?.close?.();
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch {}
      }
    }
  });
});
