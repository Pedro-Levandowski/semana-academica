import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';

describe('M4 - Certificados - ATIVIDADE_CANCELADA na emissão', () => {
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

  async function montarAtividadeCancelada() {
    const resReset = await request(app).post('/_teste/reset');
    expect(resReset.status).toBe(204);

    await definirRelogio('2026-10-18T10:00:00-03:00');

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send({
        titulo: 'Minicurso cancelado para emissão',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });
    expect(criacao.status).toBe(201);
    const atividadeId = criacao.body.id;

    const inscricao = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', PARTICIPANTE);
    expect(inscricao.status).toBe(201);

    const cancelamento = await request(app)
      .post(`/atividades/${atividadeId}/cancelamento`)
      .set('X-Usuario', ORGANIZACAO);
    expect(cancelamento.status).toBe(200);

    return { atividadeId };
  }

  function solicitarCertificado(atividadeId: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);
  }

  describe('ATIVIDADE_CANCELADA conforme o contrato', () => {
    it('recusa com 422 ATIVIDADE_CANCELADA a emissão de certificado de atividade cancelada', async () => {
      const { atividadeId } = await montarAtividadeCancelada();

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ATIVIDADE_CANCELADA');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('precedência sobre condições posteriores da emissão', () => {
    it('retorna 422 ATIVIDADE_CANCELADA e não ATIVIDADE_NAO_ENCERRADA quando os encontros ainda não teriam terminado', async () => {
      const { atividadeId } = await montarAtividadeCancelada();

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ATIVIDADE_CANCELADA');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });
});