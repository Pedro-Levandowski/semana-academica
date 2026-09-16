import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Efeitos do Cancelamento e Regras Relacionadas (Fatia 4)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('1. R27: Aumentando vagas de 10 para 12 com 8 ocupadas aciona M2 exatamente uma vez com ID correto', async () => {
    const convocadas: string[] = [];
    const fakeM2 = new (class {
      getOcupadas(_id: string) { return 8; }
      getEmEspera(_id: string) { return 2; }
      convocarEspera(id: string) { convocadas.push(id); }
      cancelarInscricoes(_id: string) {}
    })();

    const appWithM2 = createApp({ modoTeste: true, m2Port: fakeM2 });

    const postRes = await request(appWithM2)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Aumento Sem Estar Lotada',
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

  it('2. R16: Após cancelar atividade e avançar relógio após o último encontro, GET /atividades/:id continua retornando situacao: "cancelada"', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Cancelada Mantem Situacao',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancelRes.status).toBe(200);

    // Avançar relógio para depois do término do encontro
    const clockRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });
    expect(clockRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('cancelada');
  });

  it('3. R18: Atividade cancelada continua presente em GET /atividades', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Cancelada na Listagem',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancelRes.status).toBe(200);

    const listRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(listRes.status).toBe(200);
    const found = listRes.body.find((a: any) => a.id === activityId);
    expect(found).toBeDefined();
    expect(found.situacao).toBe('cancelada');
  });

  it('4. R20: Atividade cancelada que atende a ?dia=2026-10-19&tipo=minicurso continua presente no resultado filtrado', async () => {
    const postRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Cancelado Filtrado',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T16:00:00-03:00' },
          { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T16:00:00-03:00' }
        ]
      });

    expect(postRes.status).toBe(201);
    const activityId = postRes.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${activityId}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancelRes.status).toBe(200);

    const filterRes = await request(app)
      .get('/atividades?dia=2026-10-19&tipo=minicurso')
      .set('X-Usuario', 'p-carla');

    expect(filterRes.status).toBe(200);
    const found = filterRes.body.find((a: any) => a.id === activityId);
    expect(found).toBeDefined();
    expect(found.situacao).toBe('cancelada');
  });

  it('5. R8: Depois de cancelar atividade, é possível criar outra com encontro sobreposto na mesma sala (encontros cancelados não conflitam)', async () => {
    const post1 = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Primeira Atividade',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(post1.status).toBe(201);
    const id1 = post1.body.id;

    const cancelRes = await request(app)
      .post(`/atividades/${id1}/cancelamento`)
      .set('X-Usuario', 'org-ana');
    expect(cancelRes.status).toBe(200);

    // Tentar criar segunda atividade exatamente no mesmo horário na mesma sala-101
    const post2 = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Segunda Atividade Sobreposta',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(post2.status).toBe(201);
    expect(post2.body.id).toBeDefined();
  });
});
