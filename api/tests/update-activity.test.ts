import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('PATCH /atividades/:id — Edição Básica (Fatia 4)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('1. PATCH com JSON malformado, sem X-Usuario, retorna 401 USUARIO_DESCONHECIDO', async () => {
    const res = await request(app)
      .patch('/atividades/atv_12345678')
      .send('invalid json {');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('2. PATCH com JSON malformado e usuário inexistente retorna 401 USUARIO_DESCONHECIDO', async () => {
    const res = await request(app)
      .patch('/atividades/atv_12345678')
      .set('X-Usuario', 'usuario-inexistente')
      .send('invalid json {');

    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('3. PATCH de ID inexistente, com JSON malformado e usuário participante, retorna 403 SOMENTE_ORGANIZACAO', async () => {
    const res = await request(app)
      .patch('/atividades/atv_12345678')
      .set('X-Usuario', 'p-carla')
      .send('invalid json {');

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('SOMENTE_ORGANIZACAO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('4. PATCH de ID inexistente, com JSON malformado e usuário organização, retorna 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .patch('/atividades/atv_inexistente')
      .set('X-Usuario', 'org-ana')
      .send('invalid json {');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('5. PATCH de uma atividade existente, com usuário organização e JSON malformado, retorna 422 DADOS_INVALIDOS e atividade original inalterada', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Original',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .set('Content-Type', 'application/json')
      .send('invalid json {');

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('DADOS_INVALIDOS');

    // Comprovar que a atividade original permanece inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Atividade Original');
    expect(getRes.body.vagas).toBe(30);
  });

  it('6. PATCH de uma atividade existente com { "titulo": 123 } retorna 422 DADOS_INVALIDOS e atividade original inalterada', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Original 2',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 123 });

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('DADOS_INVALIDOS');

    // Comprovar que a atividade original permanece inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Atividade Original 2');
    expect(getRes.body.vagas).toBe(20);
  });

  it('7. PATCH de uma atividade existente alterando somente titulo retorna 200, representação completa, preserva demais campos e persiste novo título', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Titulo Antigo',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 25,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Titulo Novo' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toMatchObject({
      id: activityId,
      titulo: 'Titulo Novo',
      tipo: 'palestra',
      salaId: 'sala-101',
      vagas: 25,
      cargaHorariaMinutos: 60,
      situacao: 'prevista',
      ocupadas: 0,
      vagasRestantes: 25,
      emEspera: 0
    });
    expect(Array.isArray(patchRes.body.encontros)).toBe(true);
    expect(patchRes.body.encontros.length).toBe(1);

    // Comprovar persistência por GET /atividades/:id
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Titulo Novo');
    expect(getRes.body.vagas).toBe(25);
  });

  it('8. PATCH de uma atividade existente alterando somente vagas com valor válido, retorna 200, representação completa, preserva demais campos e persiste novas vagas', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Vagas',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-21T14:00:00-03:00', fim: '2026-10-21T16:00:00-03:00' },
          { inicio: '2026-10-22T14:00:00-03:00', fim: '2026-10-22T16:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 35 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toMatchObject({
      id: activityId,
      titulo: 'Minicurso Vagas',
      tipo: 'minicurso',
      salaId: 'sala-101',
      vagas: 35,
      cargaHorariaMinutos: 240,
      situacao: 'prevista',
      ocupadas: 0,
      vagasRestantes: 35,
      emEspera: 0
    });

    // Comprovar persistência por GET /atividades/:id
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana');

    expect(getRes.status).toBe(200);
    expect(getRes.body.vagas).toBe(35);
    expect(getRes.body.vagasRestantes).toBe(35);
    expect(getRes.body.titulo).toBe('Minicurso Vagas');
  });

  it('9. Enviar tipo no PATCH retorna 422 CAMPO_NAO_EDITAVEL e não altera a atividade', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Teste Tipo',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ tipo: 'minicurso' });

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('CAMPO_NAO_EDITAVEL');

    // Comprovar que a atividade original permaneceu inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.tipo).toBe('palestra');
    expect(getRes.body.titulo).toBe('Atividade Teste Tipo');
  });

  it('10. Enviar salaId no PATCH retorna 422 CAMPO_NAO_EDITAVEL e não altera a atividade', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Teste SalaId',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ salaId: 'sala-102' });

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('CAMPO_NAO_EDITAVEL');

    // Comprovar que a atividade original permaneceu inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.salaId).toBe('sala-101');
    expect(getRes.body.titulo).toBe('Atividade Teste SalaId');
  });

  it('11. Enviar encontros no PATCH retorna 422 CAMPO_NAO_EDITAVEL e não altera a atividade', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Teste Encontros',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;
    const originalEncontros = postRes.body.encontros;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({
        encontros: [
          { inicio: '2026-10-19T12:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' }
        ]
      });

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('CAMPO_NAO_EDITAVEL');

    // Comprovar que a atividade original permaneceu inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.encontros).toEqual(originalEncontros);
    expect(getRes.body.titulo).toBe('Atividade Teste Encontros');
  });

  it('12. Enviar cargaHorariaMinutos no PATCH retorna 200, ignora esse valor e preserva a carga calculada original', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Carga Horaria',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' } // 120 min
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;
    expect(postRes.body.cargaHorariaMinutos).toBe(120);

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ cargaHorariaMinutos: 999, titulo: 'Novo Titulo Carga' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.cargaHorariaMinutos).toBe(120);
    expect(patchRes.body.titulo).toBe('Novo Titulo Carga');

    // Comprovar persistência por GET /atividades/:id
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.cargaHorariaMinutos).toBe(120);
    expect(getRes.body.titulo).toBe('Novo Titulo Carga');
  });

  it('13. Alterar vagas para valor superior à capacidade da sala retorna 422 VAGAS_ACIMA_DA_CAPACIDADE e não altera a atividade', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Vagas Excedentes',
        tipo: 'palestra',
        salaId: 'sala-101', // capacidade 40
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 45 }); // acima da capacidade 40 da sala-101

    expect(patchRes.status).toBe(422);
    expect(patchRes.body.erro).toBe('VAGAS_ACIMA_DA_CAPACIDADE');

    // Comprovar que a atividade original permaneceu inalterada
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.vagas).toBe(20);
    expect(getRes.body.vagasRestantes).toBe(20);
  });

  it('14. No instante exato de início do primeiro encontro, alterar somente o título de uma atividade não cancelada retorna 200 e persiste a alteração', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Antes Inicio',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    // Posicionar o relógio no instante exato do início do primeiro encontro
    const clockRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });
    expect(clockRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Titulo No Inicio' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.titulo).toBe('Titulo No Inicio');
    expect(patchRes.body.situacao).toBe('em_andamento');

    // Comprovar persistência por GET /atividades/:id
    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.titulo).toBe('Titulo No Inicio');
  });

  it('15. Com porta M2 falsa (ocupadas: 10, emEspera: 3), GET /atividades/:id e GET /atividades apresentam ocupadas: 10, emEspera: 3, vagasRestantes: vagas - 10', async () => {
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 10; }
      getEmEspera(_id: string) { return 3; }
      convocarEspera(_id: string) {}
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade M2 Fake',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 25,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const getDetail = await request(appWithM2)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getDetail.status).toBe(200);
    expect(getDetail.body).toMatchObject({
      id: activityId,
      vagas: 25,
      ocupadas: 10,
      emEspera: 3,
      vagasRestantes: 15
    });

    const getList = await request(appWithM2)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getList.status).toBe(200);
    const found = getList.body.find((a: any) => a.id === activityId);
    expect(found).toMatchObject({
      id: activityId,
      vagas: 25,
      ocupadas: 10,
      emEspera: 3,
      vagasRestantes: 15
    });

    appWithM2?.close?.();
  });

  it('16. Atividade com 20 vagas e 10 ocupadas: PATCH reduzindo para exatamente 10 retorna 200 e vagasRestantes: 0', async () => {
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 10; }
      getEmEspera(_id: string) { return 0; }
      convocarEspera(_id: string) {}
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Reducao Exata',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(appWithM2)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 10 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.vagas).toBe(10);
    expect(patchRes.body.ocupadas).toBe(10);
    expect(patchRes.body.vagasRestantes).toBe(0);

    appWithM2?.close?.();
  });

  it('17. Atividade com 20 vagas e 10 ocupadas: PATCH reduzindo para 9 retorna 409 VAGAS_ABAIXO_DOS_INSCRITOS e GET preserva 20 vagas', async () => {
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 10; }
      getEmEspera(_id: string) { return 0; }
      convocarEspera(_id: string) {}
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Reducao Abaixo',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(appWithM2)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 9 });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.erro).toBe('VAGAS_ABAIXO_DOS_INSCRITOS');

    const getRes = await request(appWithM2)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.vagas).toBe(20);
    expect(getRes.body.vagasRestantes).toBe(10);

    appWithM2?.close?.();
  });

  it('18. Atividade com 10 vagas, 10 ocupadas e 3 em espera: PATCH aumentando para 12 retorna 200 e aciona exatamente uma vez convocarEspera com ID correto', async () => {
    const convocadas: string[] = [];
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 10; }
      getEmEspera(_id: string) { return 3; }
      convocarEspera(id: string) { convocadas.push(id); }
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Aumento Convocacao',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(appWithM2)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 12 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.vagas).toBe(12);
    expect(convocadas).toEqual([activityId]);

    appWithM2?.close?.();
  });

  it('19. PATCH alterando somente o título não aciona a operação de convocação do M2', async () => {
    const convocadas: string[] = [];
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 10; }
      getEmEspera(_id: string) { return 3; }
      convocarEspera(id: string) { convocadas.push(id); }
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Titulo Sem Convocacao',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const patchRes = await request(appWithM2)
      .patch(`/atividades/${activityId}`)
      .set('X-Usuario', 'org-ana')
      .send({ titulo: 'Novo Titulo' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.titulo).toBe('Novo Titulo');
    expect(convocadas).toEqual([]);

    appWithM2?.close?.();
  });
});
