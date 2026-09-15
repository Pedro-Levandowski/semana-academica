import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('R17 — Ordenação da listagem de atividades', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  it('1. Ordem pelo primeiro encontro: atividade mais cedo aparece primeiro independentemente da ordem de criação', async () => {
    // Cria primeiro a mais tardia
    const postTardia = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Tardia',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });
    expect(postTardia.status).toBe(201);

    // Cria depois a mais cedo
    const postCedo = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Cedo',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    expect(postCedo.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const titulos = getRes.body.map((a: any) => a.titulo);
    expect(titulos).toEqual(['Atividade Cedo', 'Atividade Tardia']);
  });

  it('2. Desempate pelo título: mesmo instante inicial, ordenação alfabética crescente', async () => {
    // Cria Zulu primeiro
    const postZulu = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Zulu',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    expect(postZulu.status).toBe(201);

    // Cria Alfa depois
    const postAlfa = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Alfa',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    expect(postAlfa.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const titulos = getRes.body.map((a: any) => a.titulo);
    expect(titulos).toEqual(['Alfa', 'Zulu']);
  });

  it('3. Comparação por instante, não por texto (fuso Z vs -03:00)', async () => {
    // Mais tarde: 2026-10-20T10:00:00-03:00 (equivale a 13:00Z)
    const postTarde = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Mais tarde',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });
    expect(postTarde.status).toBe(201);

    // Mais cedo: 2026-10-20T12:00:00Z (equivale a 09:00-03:00)
    const postCedo = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Mais cedo',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T12:00:00Z', fim: '2026-10-20T13:00:00Z' }
        ]
      });
    expect(postCedo.status).toBe(201);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const titulos = getRes.body.map((a: any) => a.titulo);
    expect(titulos).toEqual(['Mais cedo', 'Mais tarde']);
  });
});
