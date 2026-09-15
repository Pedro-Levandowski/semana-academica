import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Capacity (R7) and Room Conflict (R8)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  describe('R7 — Limites de vagas', () => {
    it('recusa vagas: 0 com 422 VAGAS_ACIMA_DA_CAPACIDADE e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Zero Vagas',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 0,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('VAGAS_ACIMA_DA_CAPACIDADE');
      expect(typeof res.body.mensagem).toBe('string');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });

    it('permite vagas: 1 com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Uma Vaga',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 1,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(201);
      expect(res.body.vagas).toBe(1);
    });

    it('permite vagas igual à capacidade da sala (40 vagas na sala-101) com 201', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Capacidade Máxima Sala 101',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 40,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(201);
      expect(res.body.vagas).toBe(40);
    });

    it('recusa vagas acima da capacidade da sala (45 vagas na sala-101, cap 40) com 422 VAGAS_ACIMA_DA_CAPACIDADE e não persiste', async () => {
      const res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Acima da Capacidade',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 45,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('VAGAS_ACIMA_DA_CAPACIDADE');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.body).toEqual([]);
    });
  });

  describe('R8 — Conflito de sala', () => {
    it('recusa encontro com intervalo de 14 minutos após o término do anterior na mesma sala com 409 CONFLITO_DE_SALA e não persiste', async () => {
      // Primeira atividade: 09:00 às 10:00
      const first = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade 1',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });
      expect(first.status).toBe(201);
      const firstId = first.body.id;

      // Segunda atividade: 10:14 às 11:14 (intervalo de 14 min)
      const second = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade 2',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T10:14:00-03:00', fim: '2026-10-19T11:14:00-03:00' }]
        });

      expect(second.status).toBe(409);
      expect(second.body.erro).toBe('CONFLITO_DE_SALA');
      expect(typeof second.body.mensagem).toBe('string');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0].id).toBe(firstId);
      expect(listRes.body[0].titulo).toBe('Atividade 1');
    });

    it('permite encontro com intervalo exato de 15 minutos após o término da anterior na mesma sala com 201', async () => {
      // Primeira atividade: 09:00 às 10:00
      const first = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade A',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });
      expect(first.status).toBe(201);
      const firstId = first.body.id;

      // Segunda atividade: 10:15 às 11:15 (intervalo exato de 15 min)
      const second = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade B',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T10:15:00-03:00', fim: '2026-10-19T11:15:00-03:00' }]
        });

      expect(second.status).toBe(201);
      const secondId = second.body.id;

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(2);
      const ids = listRes.body.map((a: any) => a.id);
      expect(ids).toContain(firstId);
      expect(ids).toContain(secondId);
    });

    it('permite mesmo horário em salas diferentes com 201', async () => {
      const first = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Sala 101',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });
      expect(first.status).toBe(201);
      const firstId = first.body.id;

      const otherRoom = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Sala 102',
          tipo: 'palestra',
          salaId: 'sala-102',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
        });

      expect(otherRoom.status).toBe(201);
      const secondId = otherRoom.body.id;

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(2);
      const ids = listRes.body.map((a: any) => a.id);
      expect(ids).toContain(firstId);
      expect(ids).toContain(secondId);
    });

    it('recusa nova atividade posicionada antes com intervalo inferior a 15 minutos com 409 CONFLITO_DE_SALA', async () => {
      // Primeira atividade: 10:00 às 11:00
      const first = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Tarde',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
        });
      expect(first.status).toBe(201);
      const firstId = first.body.id;

      // Segunda atividade antes: 09:00 às 09:46 (termina 14 min antes das 10:00)
      const before = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Antes',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T08:45:00-03:00', fim: '2026-10-19T09:46:00-03:00' }]
        });

      expect(before.status).toBe(409);
      expect(before.body.erro).toBe('CONFLITO_DE_SALA');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0].id).toBe(firstId);
      expect(listRes.body[0].titulo).toBe('Tarde');
    });

    it('recusa sobreposição real de horários na mesma sala com 409 CONFLITO_DE_SALA', async () => {
      const first = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Base',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
        });
      expect(first.status).toBe(201);
      const firstId = first.body.id;

      const overlap = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Overlap',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }]
        });

      expect(overlap.status).toBe(409);
      expect(overlap.body.erro).toBe('CONFLITO_DE_SALA');

      const listRes = await request(app).get('/atividades').set('X-Usuario', 'p-carla');
      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0].id).toBe(firstId);
      expect(listRes.body[0].titulo).toBe('Base');
    });
  });
});
