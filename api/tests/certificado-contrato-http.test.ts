import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';
const ATIVIDADE_INEXISTENTE = 'atv_nao_existe';

describe('M4 - Certificados - Contrato HTTP da emissao (401, 403, 404)', () => {
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

  async function criarAtividade() {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send({
        titulo: 'Minicurso para contrato HTTP',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  describe('Cenario 1 - autenticacao ausente', () => {
    it('retorna 401 USUARIO_DESCONHECIDO em POST /atividades/:id/certificado sem X-Usuario', async () => {
      await resetar();

      const res = await request(app).post(`/atividades/${ATIVIDADE_INEXISTENTE}/certificado`);

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('Cenario 2 - perfil nao participante', () => {
    it('retorna 403 SOMENTE_PARTICIPANTE em POST /atividades/:id/certificado para usuario da organizacao', async () => {
      await resetar();

      const res = await request(app)
        .post(`/atividades/${ATIVIDADE_INEXISTENTE}/certificado`)
        .set('X-Usuario', ORGANIZACAO);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('SOMENTE_PARTICIPANTE');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('Cenario 3 - atividade inexistente', () => {
    it('retorna 404 NAO_ENCONTRADO em POST /atividades/:id/certificado com participante valido e atividade inexistente', async () => {
      await resetar();

      const res = await request(app)
        .post(`/atividades/${ATIVIDADE_INEXISTENTE}/certificado`)
        .set('X-Usuario', PARTICIPANTE);

      expect(res.status).toBe(404);
      expect(res.body.erro).toBe('NAO_ENCONTRADO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('precedencia externa: autenticacao -> perfil -> existencia -> regras de negocio', () => {
    it('retorna 401 USUARIO_DESCONHECIDO antes de qualquer outra verificacao, mesmo com atividade inexistente', async () => {
      await resetar();

      const res = await request(app).post(`/atividades/${ATIVIDADE_INEXISTENTE}/certificado`);

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    });

    it('retorna 403 SOMENTE_PARTICIPANTE servindo-se antes do 404 quando organizacao chama com atividade inexistente', async () => {
      await resetar();

      const res = await request(app)
        .post(`/atividades/${ATIVIDADE_INEXISTENTE}/certificado`)
        .set('X-Usuario', ORGANIZACAO);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('SOMENTE_PARTICIPANTE');
    });

    it('chega as regras de negocio da emissao quando autenticacao, perfil e existencia passam', async () => {
      await resetar();

      const atividade = await criarAtividade();

      const res = await request(app)
        .post(`/atividades/${atividade.id}/certificado`)
        .set('X-Usuario', PARTICIPANTE);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('NAO_INSCRITO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });
});