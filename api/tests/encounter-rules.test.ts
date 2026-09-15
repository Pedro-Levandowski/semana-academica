import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Encounter Rules - R3, R4, R5, R6', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  describe('R3 — Duração dos encontros (60 a 240 minutos)', () => {
    it('recusa encontro com 59 minutos (abaixo do mínimo) com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra Curta',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T09:59:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');
      expect(typeof res.body.mensagem).toBe('string');

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('permite encontro com exatamente 60 minutos (limite mínimo) com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra 60min',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.cargaHorariaMinutos).toBe(60);
    });

    it('permite encontro com exatamente 240 minutos (limite máximo) com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra 240min',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T13:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.cargaHorariaMinutos).toBe(240);
    });

    it('recusa encontro com 241 minutos (acima do máximo) com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra Longa',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T13:01:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');
      expect(typeof res.body.mensagem).toBe('string');

      const listRes = await request(app)
        .get('/atividades')
        .set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('recusa data ISO inválida com 422 ENCONTRO_INVALIDO', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra Data Inválida',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: 'data-invalida', fim: '2026-10-19T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');
    });

    it('recusa data ISO sem fuso com 422 ENCONTRO_INVALIDO', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Palestra Sem Fuso',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00', fim: '2026-10-19T10:00:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');
    });
  });

  describe('R4 & R30 — Período do evento e equivalência UTC', () => {
    it('recusa encontro antes do evento (18/10/2026) com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Antes do evento',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-18T09:00:00-03:00', fim: '2026-10-18T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('permite encontro no primeiro dia do evento (19/10/2026 00:00)', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Primeiro dia',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T00:00:00-03:00', fim: '2026-10-19T01:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
    });

    it('permite encontro no último dia do evento (23/10/2026 22:00)', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Último dia',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-23T22:00:00-03:00', fim: '2026-10-23T23:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
    });

    it('recusa encontro depois do evento (24/10/2026) com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Depois do evento',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-24T09:00:00-03:00', fim: '2026-10-24T10:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('aceita encontro em UTC que corresponde ao primeiro dia em Brasília', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'UTC Equivalente',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-20T00:00:00Z', fim: '2026-10-20T01:00:00Z' }
          ]
        });

      expect(res.status).toBe(201);
    });
  });

  describe('R5 — Proibição de atravessar a meia-noite', () => {
    it('recusa encontro atravessando a meia-noite (23:00 a 01:00) com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Meia-noite',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T23:00:00-03:00', fim: '2026-10-20T01:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });
  });

  describe('R6 — Ausência de sobreposição interna', () => {
    it('recusa minicurso com encontros sobrepostos com 422 ENCONTRO_INVALIDO e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Sobreposto',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
            { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('permite minicurso com encontros encostados (término do 1º === início do 2º)', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Encostado',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' },
            { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.encontros.length).toBe(2);
    });

    it('recusa sobreposição com offsets diferentes mas mesmos instantes', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Sobreposto Offset',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
            { inicio: '2026-10-19T13:00:00Z', fim: '2026-10-19T15:00:00Z' } // 10:00 a 12:00 em Brasília
          ]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ENCONTRO_INVALIDO');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });
  });
});
