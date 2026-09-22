import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';

describe('M4 - Certificados - Integracao M3 -> M4 (G3): presenca offline contabilizada na emissao', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  async function definirRelogio(agora: string) {
    const res = await request(app).put('/_teste/relogio').send({ agora });
    expect(res.status).toBe(200);
  }

  async function registrarPresencaOffline(encontroId: string, dia: number) {
    const codigoRes = await request(app)
      .get(`/encontros/${encontroId}/codigo`)
      .set('X-Usuario', ORGANIZACAO);
    const codigo = codigoRes.body.codigo;

    const res = await request(app)
      .post(`/encontros/${encontroId}/presencas`)
      .set('X-Usuario', PARTICIPANTE)
      .send({ codigo, lidoEm: `2026-10-${dia}T19:30:00-03:00` });
    expect(res.status).toBe(201);
    expect(res.body.origem).toBe('qr_offline');
  }

  it('G3 — emite certificado 201 contabilizando presencas registradas pelo fluxo offline do M3 com lidoEm (3 de 4 encontros, 75% exato)', async () => {
    const reset = await request(app).post('/_teste/reset');
    expect(reset.status).toBe(204);

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send({
        titulo: 'Minicurso presenca offline',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
          { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T22:00:00-03:00' },
          { inicio: '2026-10-22T19:00:00-03:00', fim: '2026-10-22T22:00:00-03:00' }
        ]
      });
    expect(criacao.status).toBe(201);

    const atividadeId = criacao.body.id;
    const encontros = criacao.body.encontros;
    expect(Array.isArray(encontros)).toBe(true);
    expect(encontros.length).toBe(4);

    const inscricao = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', PARTICIPANTE);
    expect(inscricao.status).toBe(201);
    expect(inscricao.body.status).toBe('confirmada');

    for (const idx of [0, 1, 2]) {
      await definirRelogio(`2026-10-${19 + idx}T19:30:00-03:00`);
      await registrarPresencaOffline(encontros[idx].id, 19 + idx);
    }

    await definirRelogio('2026-10-24T10:00:00-03:00');

    const res = await request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);

    expect(res.status).toBe(201);
    expect(res.body.codigo).toMatch(/^SA26-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(res.body.presencas).toBe(3);
    expect(res.body.encontros).toBe(4);
    expect(res.body.atividadeId).toBe(atividadeId);
    expect(res.body.participanteId).toBe(PARTICIPANTE);
  });
});