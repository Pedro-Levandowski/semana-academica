import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API - Fases 1 & 2 (Isolado por teste)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('deve retornar 404 e JSON no formato do contrato para rota inexistente', async () => {
    const response = await request(app).get('/rota-que-nao-existe');
    expect(response.status).toBe(404);
    expect(response.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof response.body.mensagem).toBe('string');
  });

  it('recusa GET /salas sem X-Usuario com 401 USUARIO_DESCONHECIDO', async () => {
    const response = await request(app).get('/salas');
    expect(response.status).toBe(401);
    expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof response.body.mensagem).toBe('string');
  });

  it('recusa GET /salas com ID de usuário desconhecido com 401 USUARIO_DESCONHECIDO', async () => {
    const response = await request(app).get('/salas').set('X-Usuario', 'nao-existe');
    expect(response.status).toBe(401);
    expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof response.body.mensagem).toBe('string');
  });

  it('permite GET /salas com participante válido (p-carla) retornando as quatro salas e campos corretos sem ordem estrita', async () => {
    const response = await request(app).get('/salas').set('X-Usuario', 'p-carla');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
    expect(response.body).toEqual(
      expect.arrayContaining([
        { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
        { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
        { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
        { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
      ])
    );
  });

  it('permite GET /salas com organização válida (org-ana) retornando 200', async () => {
    const response = await request(app).get('/salas').set('X-Usuario', 'org-ana');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });

  it('reconhece cada um dos dez IDs iniciais pelo X-Usuario em GET /salas', async () => {
    const dezUsuarios = [
      'org-ana', 'org-bruno', 'p-carla', 'p-diego', 'p-elisa',
      'p-fabio', 'p-gabriela', 'p-heitor', 'p-isadora', 'p-joao'
    ];
    for (const uid of dezUsuarios) {
      const res = await request(app).get('/salas').set('X-Usuario', uid);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(4);
    }
  });

  it('recusa GET /atividades sem X-Usuario com 401 USUARIO_DESCONHECIDO', async () => {
    const response = await request(app).get('/atividades');
    expect(response.status).toBe(401);
    expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof response.body.mensagem).toBe('string');
  });

  it('recusa GET /atividades com ID de usuário desconhecido com 401 USUARIO_DESCONHECIDO', async () => {
    const response = await request(app).get('/atividades').set('X-Usuario', 'nao-existe');
    expect(response.status).toBe(401);
    expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof response.body.mensagem).toBe('string');
  });

  it('permite GET /atividades com participante válido (p-carla) retornando 200 e lista vazia no banco inicial', async () => {
    const response = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([]);
  });

  it('permite GET /atividades com organização válida (org-ana) retornando 200 e lista vazia no banco inicial', async () => {
    const response = await request(app).get('/atividades').set('X-Usuario', 'org-ana');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual([]);
  });

  describe('Ciclo C — Validação do relógio controlado e rotas de teste', () => {
    it('recusa PUT /_teste/relogio com agora inválido (não ISO 8601 com fuso) com 422 DADOS_INVALIDOS', async () => {
      const response = await request(app)
        .put('/_teste/relogio')
        .send({ agora: 'data-invalida' });
      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('recusa PUT /_teste/relogio com agora sem Z nem offset explícito ("2026-10-13T09:00:00") com 422 DADOS_INVALIDOS', async () => {
      const response = await request(app)
        .put('/_teste/relogio')
        .send({ agora: '2026-10-13T09:00:00' });
      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('recusa PUT /_teste/relogio sem o campo agora com 422 DADOS_INVALIDOS', async () => {
      const response = await request(app)
        .put('/_teste/relogio')
        .send({});
      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('recusa PUT /_teste/relogio com agora não sendo string (número) com 422 DADOS_INVALIDOS', async () => {
      const response = await request(app)
        .put('/_teste/relogio')
        .send({ agora: 1728800000000 });
      expect(response.status).toBe(422);
      expect(response.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('permite PUT /_teste/relogio com data válida ISO 8601 com fuso', async () => {
      const novaData = '2026-10-20T14:30:00-03:00';
      const response = await request(app)
        .put('/_teste/relogio')
        .send({ agora: novaData });
      expect(response.status).toBe(200);
      expect(response.body.agora).toBe(novaData);
    });

    it('preserva o mesmo instante em GET /_teste/relogio após PUT', async () => {
      const novaData = '2026-10-21T08:00:00Z';
      await request(app).put('/_teste/relogio').send({ agora: novaData });
      const getRes = await request(app).get('/_teste/relogio');
      expect(getRes.status).toBe(200);
      expect(getRes.body.agora).toBe(novaData);
    });

    it('permite acessar rotas de teste sem cabeçalho X-Usuario', async () => {
      const resGet = await request(app).get('/_teste/relogio');
      expect(resGet.status).toBe(200);

      const resReset = await request(app).post('/_teste/reset');
      expect(resReset.status).toBe(204);
    });
  });

  describe('Ciclo D — Reset e isolamento', () => {
    it('POST /_teste/reset retorna 204', async () => {
      const res = await request(app).post('/_teste/reset');
      expect(res.status).toBe(204);
    });

    it('reset restaura o relógio para 2026-10-13T09:00:00-03:00 após alteração', async () => {
      await request(app).put('/_teste/relogio').send({ agora: '2026-10-22T10:00:00-03:00' });
      const beforeReset = await request(app).get('/_teste/relogio');
      expect(beforeReset.body.agora).toBe('2026-10-22T10:00:00-03:00');

      await request(app).post('/_teste/reset');
      const afterReset = await request(app).get('/_teste/relogio');
      expect(afterReset.status).toBe(200);
      expect(afterReset.body.agora).toBe('2026-10-13T09:00:00-03:00');
    });

    it('depois do reset, as quatro salas continuam exatas', async () => {
      await request(app).post('/_teste/reset');
      const res = await request(app).get('/salas').set('X-Usuario', 'p-carla');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(4);
      expect(res.body).toEqual(
        expect.arrayContaining([
          { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
          { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
          { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
          { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 }
        ])
      );
    });

    it('sem MODO_TESTE=1, rotas /_teste/* retornam 404', async () => {
      const prodApp = createApp({ modoTeste: false });
      const resGet = await request(prodApp).get('/_teste/relogio');
      expect(resGet.status).toBe(404);
      expect(resGet.body.erro).toBe('NAO_ENCONTRADO');

      const resPut = await request(prodApp).put('/_teste/relogio').send({ agora: '2026-10-15T10:00:00-03:00' });
      expect(resPut.status).toBe(404);

      const resPost = await request(prodApp).post('/_teste/reset');
      expect(resPost.status).toBe(404);
      (prodApp as any).close?.();
    });
  });
});
