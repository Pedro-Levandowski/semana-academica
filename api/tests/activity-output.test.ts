import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Activity Output and Carga Horaria & Ordenacao (Fatia 2)', () => {
  let app: any;

  beforeEach(async () => {
    app = createApp({ modoTeste: true });
    await request(app).post('/_teste/reset');
  });

  afterEach(() => {
    app?.close?.();
  });

  it('R9 — Soma exata da carga horaria sem arredondar cada encontro individualmente', async () => {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Exato',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:30-03:00' },
          { inicio: '2026-10-20T13:00:00-03:00', fim: '2026-10-20T14:30:30-03:00' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.cargaHorariaMinutos).toBe(151);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const atv = getRes.body.find((a: any) => a.id === res.body.id);
    expect(atv).toBeDefined();
    expect(atv.cargaHorariaMinutos).toBe(151);
  });

  it('R9 — Carga horaria fracionada exata (60.5 minutos) sem arredondamento', async () => {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Fracionada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:30-03:00' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.cargaHorariaMinutos).toBe(60.5);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const atv = getRes.body.find((a: any) => a.id === res.body.id);
    expect(atv).toBeDefined();
    expect(atv.cargaHorariaMinutos).toBe(60.5);
  });

  it('R10 — Valor enviado pelo cliente em cargaHorariaMinutos é ignorado', async () => {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra com Carga Forçada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        cargaHorariaMinutos: 999,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.cargaHorariaMinutos).toBe(60);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const atv = getRes.body.find((a: any) => a.id === res.body.id);
    expect(atv).toBeDefined();
    expect(atv.cargaHorariaMinutos).toBe(60);
  });

  it('R21 — Encontros ordenados por instante de início (Luxon, offsets diferentes)', async () => {
    // 1. Envio primeiro: 10:00-03:00 (que é 13:00 UTC)
    // 2. Envio depois: 12:00Z (que é 09:00-03:00, instante anterior)
    const enc1 = { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' };
    const enc2 = { inicio: '2026-10-20T12:00:00Z', fim: '2026-10-20T13:00:00Z' };

    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Desordenado',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [enc1, enc2]
      });

    expect(res.status).toBe(201);
    expect(res.body.encontros).toHaveLength(2);
    // O encontro às 12:00Z (09:00 -03:00) deve vir antes do encontro às 10:00 -03:00
    expect(res.body.encontros[0].inicio).toBe(enc2.inicio);
    expect(res.body.encontros[1].inicio).toBe(enc1.inicio);

    const getRes = await request(app)
      .get('/atividades')
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    const atv = getRes.body.find((a: any) => a.id === res.body.id);
    expect(atv).toBeDefined();
    expect(atv.encontros[0].inicio).toBe(enc2.inicio);
    expect(atv.encontros[1].inicio).toBe(enc1.inicio);
  });
});
