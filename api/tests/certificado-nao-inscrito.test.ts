import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const OUTRO_PARTICIPANTE = 'p-diego';
const ORGANIZACAO = 'org-ana';

describe('M4 - Certificados - NAO_INSCRITO na emissão', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  async function resetar() {
    const res = await request(app).post('/_teste/reset');
    expect(res.status).toBe(204);
  }

  async function definirRelogio(agora: string) {
    const res = await request(app).put('/_teste/relogio').send({ agora });
    expect(res.status).toBe(200);
  }

  async function criarAtividade(dados: {
    titulo: string;
    tipo: 'palestra' | 'minicurso';
    salaId: string;
    vagas: number;
    encontros: Array<{ inicio: string; fim: string }>;
  }) {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send(dados);
    expect(res.status).toBe(201);
    return res.body;
  }

  function inscrever(atividadeId: string, participante: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', participante);
  }

  function solicitarCertificado(atividadeId: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);
  }

  describe('exigência de inscrição confirmada conforme o contrato', () => {
    it('recusa com 403 NAO_INSCRITO a emissão de certificado de participante sem nenhuma inscrição na atividade', async () => {
      await resetar();

      const atividade = await criarAtividade({
        titulo: 'Minicurso sem inscrição',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const res = await solicitarCertificado(atividade.id);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('recusa com 403 NAO_INSCRITO a emissão quando a inscrição está cancelada, não tratando o vínculo como válido', async () => {
      await resetar();

      const atividade = await criarAtividade({
        titulo: 'Minicurso com inscrição cancelada',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      const inscricao = await inscrever(atividade.id, PARTICIPANTE);
      expect(inscricao.status).toBe(201);
      expect(inscricao.body.status).toBe('confirmada');

      const cancelada = await request(app)
        .post(`/inscricoes/${inscricao.body.id}/cancelamento`)
        .set('X-Usuario', PARTICIPANTE);
      expect(cancelada.status).toBe(200);
      expect(cancelada.body.status).toBe('cancelada');

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const res = await solicitarCertificado(atividade.id);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('trata inscrição em_espera como não inscrito e recusa com 403 NAO_INSCRITO a emissão', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra com lista de espera',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      const insDiego = await inscrever(palestra.id, OUTRO_PARTICIPANTE);
      expect(insDiego.status).toBe(201);
      expect(insDiego.body.status).toBe('confirmada');

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('em_espera');

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const res = await solicitarCertificado(palestra.id);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('precedência de NAO_INSCRITO sobre as condições posteriores da emissão', () => {
    it('retorna 403 NAO_INSCRITO e não ATIVIDADE_NAO_ENCERRADA quando a atividade ainda não teria terminado', async () => {
      await resetar();

      const atividade = await criarAtividade({
        titulo: 'Minicurso ainda em andamento',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      await definirRelogio('2026-10-20T21:00:00-03:00');

      const res = await solicitarCertificado(atividade.id);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('retorna 403 NAO_INSCRITO e não PRESENCA_INSUFICIENTE quando a presença registrada seria insuficiente', async () => {
      await resetar();

      const atividade = await criarAtividade({
        titulo: 'Minicurso sem presenças',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const res = await solicitarCertificado(atividade.id);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });
});