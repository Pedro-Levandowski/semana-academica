import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /atividades/:id — Consultas e Detalhes (Fatia 3)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('1. Autenticação ausente: GET /atividades/atv_inexistente sem X-Usuario retorna 401 USUARIO_DESCONHECIDO (prevalece sobre inexistência do ID)', async () => {
    const res = await request(app).get('/atividades/atv_inexistente');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('2. Usuário desconhecido: GET /atividades/atv_inexistente com X-Usuario inválido retorna 401 USUARIO_DESCONHECIDO', async () => {
    const res = await request(app)
      .get('/atividades/atv_inexistente')
      .set('X-Usuario', 'usuario-inexistente');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('3. Atividade inexistente: GET /atividades/atv_inexistente com participante (p-carla) retorna 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .get('/atividades/atv_inexistente')
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('4. Participante consulta atividade existente: retorna 200 e representação pública completa', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra de Abertura',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({
      id: activityId,
      titulo: 'Palestra de Abertura',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 30,
      cargaHorariaMinutos: 60,
      situacao: 'prevista',
      ocupadas: 0,
      vagasRestantes: 30,
      emEspera: 0
    });
    expect(Array.isArray(getRes.body.encontros)).toBe(true);
    expect(getRes.body.encontros.length).toBe(1);
  });

  it('5. Organização também pode consultar: GET /atividades/:id com X-Usuario: org-ana retorna 200', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Avançado',
        tipo: 'minicurso',
        salaId: 'sala-102',
        vagas: 25,
        encontros: [
          { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T16:00:00-03:00' },
          { inicio: '2026-10-21T14:00:00-03:00', fim: '2026-10-21T16:00:00-03:00' }
        ]
      });

    const activityId = postRes.body.id;

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana');

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(activityId);
  });

  it('6. Prova definitiva de R21: ordenação cronológica de encontros com offsets diferentes', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso R21',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 15,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' },
          { inicio: '2026-10-20T12:00:00Z', fim: '2026-10-20T13:00:00Z' }
        ]
      });

    expect(postRes.status).toBe(201);
    const createdEncontros = postRes.body.encontros;
    expect(createdEncontros.length).toBe(2);

    const activityId = postRes.body.id;

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const detailEncontros = getRes.body.encontros;

    // O encontro iniciado às 12:00Z (09:00-03:00) é cronologicamente anterior ao de 10:00-03:00 e deve aparecer primeiro
    expect(detailEncontros[0].inicio).toBe('2026-10-20T12:00:00Z');
    expect(detailEncontros[1].inicio).toBe('2026-10-20T10:00:00-03:00');

    // IDs associados devem ser mantidos e lista completa igual à ordenada retornada pelo POST
    expect(detailEncontros).toEqual(createdEncontros);
  });
});
