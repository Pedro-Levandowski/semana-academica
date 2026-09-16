import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('R15 — Estados temporais da atividade', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  async function createTestMinicurso(appInstance: any) {
    const postRes = await request(appInstance)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Temporal',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
          { inicio: '2026-10-20T09:00:00-03:00', fim: '2026-10-20T10:00:00-03:00' }
        ]
      });
    expect(postRes.status).toBe(201);
    return postRes.body.id;
  }

  it('1. Antes do primeiro encontro, situação é prevista', async () => {
    const activityId = await createTestMinicurso(app);

    const relogioRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T08:59:59-03:00' });
    expect(relogioRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('prevista');
  });

  it('2. No instante exato do início, situação é em_andamento', async () => {
    const activityId = await createTestMinicurso(app);

    const relogioRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:00:00-03:00' });
    expect(relogioRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('em_andamento');
  });

  it('3. No intervalo entre os encontros, situação continua em_andamento', async () => {
    const activityId = await createTestMinicurso(app);

    const relogioRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });
    expect(relogioRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('em_andamento');
  });

  it('4. Imediatamente antes do término do último encontro, situação continua em_andamento', async () => {
    const activityId = await createTestMinicurso(app);

    const relogioRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-20T09:59:59.999-03:00' });
    expect(relogioRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('em_andamento');
  });

  it('5. No instante exato do término do último encontro, situação é encerrada', async () => {
    const activityId = await createTestMinicurso(app);

    const relogioRes = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-20T10:00:00-03:00' });
    expect(relogioRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/atividades/${activityId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.situacao).toBe('encerrada');
  });
});
