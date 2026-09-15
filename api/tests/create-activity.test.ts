import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('POST /atividades - TDD Cycles', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  describe('Ciclo TDD A — autenticação R24', () => {
    it('recusa POST /atividades sem X-Usuario com 401 USUARIO_DESCONHECIDO', async () => {
      const response = await request(app)
        .post('/atividades')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(response.status).toBe(401);
      expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('recusa POST /atividades com X-Usuario: usuario-inexistente com 401 USUARIO_DESCONHECIDO', async () => {
      const response = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'usuario-inexistente')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(response.status).toBe(401);
      expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('prioriza 401 USUARIO_DESCONHECIDO sobre 422 ao enviar corpo malformado sem X-Usuario', async () => {
      const response = await request(app)
        .post('/atividades')
        .set('Content-Type', 'application/json')
        .send('{ malformed json');

      expect(response.status).toBe(401);
      expect(response.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof response.body.mensagem).toBe('string');
    });
  });

  describe('Ciclo TDD B — autorização R25', () => {
    it('recusa POST /atividades com participante (p-carla) com 403 SOMENTE_ORGANIZACAO', async () => {
      const response = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'p-carla')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(response.status).toBe(403);
      expect(response.body.erro).toBe('SOMENTE_ORGANIZACAO');
      expect(typeof response.body.mensagem).toBe('string');
    });

    it('prioriza 403 SOMENTE_ORGANIZACAO sobre 422 ao enviar corpo malformado com participante (p-carla)', async () => {
      const response = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'p-carla')
        .set('Content-Type', 'application/json')
        .send('{ malformed json');

      expect(response.status).toBe(403);
      expect(response.body.erro).toBe('SOMENTE_ORGANIZACAO');
      expect(typeof response.body.mensagem).toBe('string');
    });
  });

  describe('Ciclo TDD C — corpo estrutural R26', () => {
    it('corpo JSON malformado -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .set('Content-Type', 'application/json')
        .send('{ malformed json');

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('campo obrigatório ausente (titulo) -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('tipo incorreto (vagas: "20") -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Intro',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: '20',
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('tipo diferente de palestra ou minicurso -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Intro',
          tipo: 'workshop',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('encontros que não seja uma lista -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Intro',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: 'nao-e-lista'
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('encontro sem inicio ou fim string -> 422 DADOS_INVALIDOS', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Intro',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: 12345, fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('DADOS_INVALIDOS');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('Ciclo TDD D — sala inexistente R26', () => {
    it('salaId inexistente -> 404 NAO_ENCONTRADO', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-inexistente',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(404);
      expect(res.body.erro).toBe('NAO_ENCONTRADO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('Ciclo TDD E — criação válida, persistência e R29', () => {
    it('cria atividade válida com org-ana, gerando IDs com prefixos corretos e status 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^atv_[0-9a-f]{8}$/);
      expect(res.body.titulo).toBe('Introdução ao TypeScript');
      expect(res.body.tipo).toBe('palestra');
      expect(res.body.salaId).toBe('sala-101');
      expect(res.body.vagas).toBe(20);
      expect(res.body.cargaHorariaMinutos).toBe(60);
      expect(res.body.situacao).toBe('prevista');
      expect(res.body.ocupadas).toBe(0);
      expect(res.body.vagasRestantes).toBe(20);
      expect(res.body.emEspera).toBe(0);
      expect(Array.isArray(res.body.encontros)).toBe(true);
      expect(res.body.encontros.length).toBe(1);
      expect(res.body.encontros[0].id).toMatch(/^enc_[0-9a-f]{8}$/);
      expect(res.body.encontros[0].inicio).toBe('2026-10-19T09:00:00-03:00');
      expect(res.body.encontros[0].fim).toBe('2026-10-19T10:00:00-03:00');
    });
  });

  describe('Ciclo TDD F — efeito persistido', () => {
    it('atividade criada aparece na listagem GET /atividades', async () => {
      const created = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(created.status).toBe(201);

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0].id).toBe(created.body.id);
      expect(listRes.body[0].titulo).toBe('Introdução ao TypeScript');
    });
  });

  describe('Ciclo R1 — quantidade de encontros de palestra', () => {
    it('recusa palestra com 2 encontros com 422 QUANTIDADE_DE_ENCONTROS e não persiste atividade', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra Longa',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
            { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
      expect(typeof res.body.mensagem).toBe('string');

      // Comprovar que nada foi persistido
      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body).toEqual([]);
    });
  });

  describe('Ciclo R2 — quantidade de encontros de minicurso', () => {
    it('recusa minicurso com 1 encontro com 422 QUANTIDADE_DE_ENCONTROS e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso Curto',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
      expect(typeof res.body.mensagem).toBe('string');

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('permite minicurso com exatamente 2 encontros com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 2 Encontros',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
            { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.encontros.length).toBe(2);
    });

    it('permite minicurso com exatamente 5 encontros com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 5 Encontros',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
            { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' },
            { inicio: '2026-10-21T09:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' },
            { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T10:00:00-03:00' },
            { inicio: '2026-10-23T09:00:00-03:00', fim: '2026-10-23T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.encontros.length).toBe(5);
    });

    it('recusa minicurso com 6 encontros com 422 QUANTIDADE_DE_ENCONTROS e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 6 Encontros',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
            { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' },
            { inicio: '2026-10-21T09:00:00-03:00', fim: '2026-10-21T10:00:00-03:00' },
            { inicio: '2026-10-22T09:00:00-03:00', fim: '2026-10-22T10:00:00-03:00' },
            { inicio: '2026-10-23T09:00:00-03:00', fim: '2026-10-23T10:00:00-03:00' },
            { inicio: '2026-10-23T11:00:00-03:00', fim: '2026-10-23T12:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('QUANTIDADE_DE_ENCONTROS');
      expect(typeof res.body.mensagem).toBe('string');

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });
  });

  describe('Ciclo TDD G — reset pela API pública', () => {
    it('POST /_teste/reset remove a atividade criada e deixa GET /atividades vazio', async () => {
      const created = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Introdução ao TypeScript',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            {
              inicio: '2026-10-19T09:00:00-03:00',
              fim: '2026-10-19T10:00:00-03:00'
            }
          ]
        });

      expect(created.status).toBe(201);

      const resetRes = await request(app).post('/_teste/reset');
      expect(resetRes.status).toBe(204);

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');

      expect(listRes.status).toBe(200);
      expect(listRes.body).toEqual([]);
    });
  });
});
