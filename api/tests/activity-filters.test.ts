import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('R19 & R20 — Filtros por dia e tipo na listagem de atividades', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('Cenário 1: Filtro por dia — inclui atividade com pelo menos um encontro no dia e exclui as demais', async () => {
    // Minicurso com encontro em 19/10/2026 e 20/10/2026
    const postMini = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Multi-dia',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });
    expect(postMini.status).toBe(201);

    // Palestra somente em 20/10/2026
    const postPalestra = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Dia 20',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 40,
        encontros: [
          { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T15:00:00-03:00' }
        ]
      });
    expect(postPalestra.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades?dia=2026-10-19')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].titulo).toBe('Minicurso Multi-dia');
  });

  it('Cenário 2: Calendário de Brasília, não data UTC (21:00 a 22:30 -03:00 em 19/10)', async () => {
    // 2026-10-19T21:00:00-03:00 é 2026-10-20T00:00:00Z (dia seguinte em UTC, mas dia 19 em Brasília)
    const postAtv = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Noturna Brasília',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T21:00:00-03:00', fim: '2026-10-19T22:30:00-03:00' }
        ]
      });
    expect(postAtv.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades?dia=2026-10-19')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].titulo).toBe('Palestra Noturna Brasília');
  });

  it('Cenário 3: Filtro isolado por tipo', async () => {
    const postPalestra = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minha Palestra',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    expect(postPalestra.status).toBe(201);

    const postMini = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Meu Minicurso',
        tipo: 'minicurso',
        salaId: 'sala-102',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T16:00:00-03:00' },
          { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T16:00:00-03:00' }
        ]
      });
    expect(postMini.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades?tipo=minicurso')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].tipo).toBe('minicurso');
    expect(getRes.body[0].titulo).toBe('Meu Minicurso');
  });

  it('Cenário 4: Combinação dos filtros por dia e tipo (lógica AND)', async () => {
    // Minicurso no dia 19
    const postMini19 = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Dia 19',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });
    expect(postMini19.status).toBe(201);

    // Palestra no dia 19
    const postPalestra19 = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Dia 19',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });
    expect(postPalestra19.status).toBe(201);

    // Minicurso somente no dia 20
    const postMini20 = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Dia 20',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' },
          { inicio: '2026-10-21T10:00:00-03:00', fim: '2026-10-21T11:00:00-03:00' }
        ]
      });
    expect(postMini20.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades?dia=2026-10-19&tipo=minicurso')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].titulo).toBe('Minicurso Dia 19');
  });
});
