import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('POST /atividades/:id/cancelamento — Cancelamento (Fatia 4)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('1. Sem X-Usuario, cancelamento de ID inexistente retorna 401 USUARIO_DESCONHECIDO', async () => {
    const res = await request(app).post('/atividades/atv_inexistente/cancelamento');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('2. Usuário desconhecido retorna 401 USUARIO_DESCONHECIDO', async () => {
    const res = await request(app)
      .post('/atividades/atv_inexistente/cancelamento')
      .set('X-Usuario', 'usuario-inexistente');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('3. Participante cancelando ID inexistente retorna 403 SOMENTE_ORGANIZACAO', async () => {
    const res = await request(app)
      .post('/atividades/atv_inexistente/cancelamento')
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('SOMENTE_ORGANIZACAO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('4. Organização cancelando ID inexistente retorna 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .post('/atividades/atv_inexistente/cancelamento')
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('5. Antes do primeiro encontro, o cancelamento retorna 200 com situacao: "cancelada"; GET posterior confirma a persistência', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade para Cancelar',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.situacao).toBe('cancelada');

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('cancelada');
  });

  it('6. No instante exato do início do primeiro encontro, retorna 422 ATIVIDADE_JA_INICIADA; GET posterior comprova que a atividade não foi cancelada', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Inicio Exato',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    // Posicionar relógio no instante exato do início
    const clockRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T14:00:00-03:00' });
    expect(clockRes.status).toBe(200);

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');

    expect(cancelRes.status).toBe(422);
    expect(cancelRes.body.erro).toBe('ATIVIDADE_JA_INICIADA');

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('em_andamento');
  });

  it('7. Cancelar novamente uma atividade cancelada retorna 422 ATIVIDADE_CANCELADA', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Duplo Cancelamento',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancel1 = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancel1.status).toBe(200);

    const cancel2 = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancel2.status).toBe(422);
    expect(cancel2.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('8. PATCH válido em atividade cancelada retorna 422 ATIVIDADE_CANCELADA, sem alterar seus dados', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Titulo Original Cancelada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancelRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Titulo Alterado Tentativa' });

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('ATIVIDADE_CANCELADA');

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Titulo Original Cancelada');
    expect(getRes.body.situacao).toBe('cancelada');
  });

  it('9. Um cancelamento bem-sucedido aciona exatamente uma vez a porta falsa do M2 para cancelar inscrições ativas, passando o ID correto', async () => {
    const canceladasM2: string[] = [];
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 0; }
      getEmEspera(_id: string) { return 0; }
      convocarEspera(_id: string) {}
      cancelarInscricoes(id: string) { canceladasM2.push(id); }
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Cancelamento com M2',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(appWithM2)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');

    expect(cancelRes.status).toBe(200);
    expect(canceladasM2).toEqual([activityId]);

    appWithM2?.close?.();
  });
});
