import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M5 - Painel - Fatia 4 (Exportação CSV de Frequência)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-painel-fatia4-${Date.now()}-${Math.random()}.sqlite`);

    const painelQueryPort = {
      listarAtividades: () => [
        {
          id: 'act-csv',
          titulo: 'Atividade CSV',
          vagas: 10,
          cancelada: false,
          encontros: [
            {
              id: 'enc-4',
              inicio: '2026-10-22T08:00:00-03:00',
              fim: '2026-10-22T10:00:00-03:00',
              presencas: []
            },
            {
              id: 'enc-b',
              inicio: '2026-10-19T08:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00',
              presencas: [
                { participanteId: 'p-ana-1' },
                { participanteId: 'p-ana-2' }
              ]
            },
            {
              id: 'enc-a',
              inicio: '2026-10-19T08:00:00-03:00',
              fim: '2026-10-19T09:00:00-03:00',
              presencas: [
                { participanteId: 'p-ana-1' },
                { participanteId: 'p-carla-csv' }
              ]
            },
            {
              id: 'enc-1',
              inicio: '2026-10-19T06:00:00-03:00',
              fim: '2026-10-19T07:00:00-03:00',
              presencas: [
                { participanteId: 'p-ana-1' },
                { participanteId: 'p-ana-2' },
                { participanteId: 'p-carla-csv' }
              ]
            }
          ],
          inscricoes: [
            { participanteId: 'p-ana-1', nome: 'Ana Igual', status: 'confirmada' },
            { participanteId: 'p-ana-2', nome: 'Ana Igual', status: 'confirmada' },
            { participanteId: 'p-carla-csv', nome: 'Carla Mendes Souza', status: 'confirmada' },
            { participanteId: 'p-espera', nome: 'Abe Espera', status: 'em_espera' },
            { participanteId: 'p-conv', nome: 'Abe Convocado', status: 'convocada' },
            { participanteId: 'p-canc', nome: 'Abe Cancelado', status: 'cancelada' },
            { participanteId: 'p-exp', nome: 'Abe Expirado', status: 'expirada' }
          ]
        },
        {
          id: 'act-csv-encerrada',
          titulo: 'Atividade Encerrada',
          vagas: 10,
          cancelada: false,
          encontros: [
            { id: 'enc-e1', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T10:00:00-03:00', presencas: [{ participanteId: 'p-ana-elig' }, { participanteId: 'p-bruno-inex' }] },
            { id: 'enc-e2', inicio: '2026-10-19T12:00:00-03:00', fim: '2026-10-19T14:00:00-03:00', presencas: [{ participanteId: 'p-ana-elig' }, { participanteId: 'p-bruno-inex' }] },
            { id: 'enc-e3', inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T10:00:00-03:00', presencas: [{ participanteId: 'p-ana-elig' }] },
            { id: 'enc-e4', inicio: '2026-10-20T12:00:00-03:00', fim: '2026-10-20T14:00:00-03:00', presencas: [] }
          ],
          inscricoes: [
            { participanteId: 'p-ana-elig', nome: 'Ana Elegível', status: 'confirmada' },
            { participanteId: 'p-bruno-inex', nome: 'Bruno Inelegível', status: 'confirmada' }
          ]
        },
        {
          id: 'act-csv-cancelada',
          titulo: 'Atividade Cancelada',
          vagas: 10,
          cancelada: true,
          encontros: [
            { id: 'enc-c1', inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T10:00:00-03:00', presencas: [{ participanteId: 'p-canc-1' }] },
            { id: 'enc-c2', inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T10:00:00-03:00', presencas: [{ participanteId: 'p-canc-1' }] }
          ],
          inscricoes: [
            { participanteId: 'p-canc-1', nome: 'Participante Cancelado', status: 'confirmada' }
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

  it('exporta CSV de frequência com ordenação, formatação, BOM, P/F/- e exclusão de não confirmados (R9, R10, R11, R12)', async () => {
    const res = await request(app)
      .get('/painel/atividades/act-csv/frequencia.csv')
      .set('X-Usuario', 'org-ana')
      .parse((res: any, callback: any) => {
        let data: any[] = [];
        res.on('data', (chunk: any) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="frequencia.csv"');

    const buf = res.body as Buffer;
    expect(buf[0]).toBe(0xEF);
    expect(buf[1]).toBe(0xBB);
    expect(buf[2]).toBe(0xBF);
    expect(buf[buf.length - 1]).toBe(0x0A);

    const text = buf.toString('utf8');
    const expected = '\uFEFFnome;E1;E2;E3;E4;frequencia;certificado\nAna Igual;P;P;P;-;75,0;nao\nAna Igual;P;F;P;-;50,0;nao\nCarla Mendes Souza;P;P;F;-;50,0;nao\n';
    expect(text).toBe(expected);
  });

  it('exporta CSV de frequência com certificado sim/nao para atividade encerrada (R12)', async () => {
    const res = await request(app)
      .get('/painel/atividades/act-csv-encerrada/frequencia.csv')
      .set('X-Usuario', 'org-ana')
      .parse((res: any, callback: any) => {
        let data: any[] = [];
        res.on('data', (chunk: any) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    const text = (res.body as Buffer).toString('utf8');
    const expected = '\uFEFFnome;E1;E2;E3;E4;frequencia;certificado\nAna Elegível;P;P;P;F;75,0;sim\nBruno Inelegível;P;P;F;F;50,0;nao\n';
    expect(text).toBe(expected);
  });

  it('retorna CSV com apenas cabeçalho para atividade cancelada e 404 para atividade inexistente (R13)', async () => {
    const resCancelada = await request(app)
      .get('/painel/atividades/act-csv-cancelada/frequencia.csv')
      .set('X-Usuario', 'org-ana')
      .parse((res: any, callback: any) => {
        let data: any[] = [];
        res.on('data', (chunk: any) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(resCancelada.status).toBe(200);
    const textC = (resCancelada.body as Buffer).toString('utf8');
    expect(textC).toBe('\uFEFFnome;E1;E2;frequencia;certificado\n');

    const resInexistente = await request(app)
      .get('/painel/atividades/act-csv-inexistente/frequencia.csv')
      .set('X-Usuario', 'org-ana');

    expect(resInexistente.status).toBe(404);
    expect(resInexistente.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof resInexistente.body.mensagem).toBe('string');
    expect(resInexistente.body.mensagem.length).toBeGreaterThan(0);
  });
});
