import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M2 - Inscrições - Fatia 2 (Validações de Negócio e Conflitos)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-inscricoes-f2-${Date.now()}-${Math.random()}.sqlite`);
    app = createApp({ dbPath, modoTeste: true });
    await request(app).post('/_teste/reset');
  });

  afterEach(() => {
    app?.close?.();
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {}
    }
  });

  it('R4 (Critério 7) — recusa inscrição de participante bloqueado por faltas (2 atividades encerradas com zero presença em ambas) com 422 INSCRICAO_BLOQUEADA', async () => {
    // 1. Relógio no passado (dia 19/10/2026 das 08:00 às 12:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T08:00:00-03:00' });

    // Cria Atividade 1 no passado
    const atv1Res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Faltosa 1',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
        ]
      });
    const atv1Id = atv1Res.body.id;

    // p-carla se inscreve na Atividade 1
    await request(app)
      .post(`/atividades/${atv1Id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // Cria Atividade 2 no passado
    const atv2Res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Faltosa 2',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:30:00-03:00', fim: '2026-10-19T11:30:00-03:00' }
        ]
      });
    const atv2Id = atv2Res.body.id;

    // p-carla se inscreve na Atividade 2
    await request(app)
      .post(`/atividades/${atv2Id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // Avança relógio para depois do término das duas atividades (ex: 12:00:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    // Cria Atividade 3 no futuro (ex: dia 20)
    const atv3Res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Atividade Futura',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });
    const atv3Id = atv3Res.body.id;

    // p-carla (que não registrou presença nem na Atividade 1 nem na 2) tenta se inscrever na Atividade 3
    const res = await request(app)
      .post(`/atividades/${atv3Id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('INSCRICAO_BLOQUEADA');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('R5 (Critério 8) — recusa inscrição no 4º minicurso ocupando vaga com 422 LIMITE_DE_MINICURSOS', async () => {
    // Cria 3 minicursos em dias/horários válidos (minicursos precisam de 2 a 5 encontros)
    const mc1Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso 1', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' },
        { inicio: '2026-10-20T09:30:00-03:00', fim: '2026-10-20T10:30:00-03:00' }
      ]
    });
    expect(mc1Res.status).toBe(201);

    const mc2Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso 2', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00' },
        { inicio: '2026-10-21T09:30:00-03:00', fim: '2026-10-21T10:30:00-03:00' }
      ]
    });
    expect(mc2Res.status).toBe(201);

    const mc3Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso 3', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T09:00:00-03:00' },
        { inicio: '2026-10-22T09:30:00-03:00', fim: '2026-10-22T10:30:00-03:00' }
      ]
    });
    expect(mc3Res.status).toBe(201);

    // p-carla se inscreve nos 3 minicursos
    await request(app).post(`/atividades/${mc1Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${mc2Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${mc3Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cria 4º minicurso
    const mc4Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso 4', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-23T08:00:00-03:00', fim: '2026-10-23T09:00:00-03:00' },
        { inicio: '2026-10-23T09:30:00-03:00', fim: '2026-10-23T10:30:00-03:00' }
      ]
    });
    expect(mc4Res.status).toBe(201);

    // p-carla tenta se inscrever no 4º minicurso -> 422 LIMITE_DE_MINICURSOS
    const res = await request(app)
      .post(`/atividades/${mc4Res.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('LIMITE_DE_MINICURSOS');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('R5 (Critério 9) — permite inscrição quando participante tem 3 minicursos em estado em_espera', async () => {
    // Cria 3 minicursos com apenas 1 vaga cada
    const mc1Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso Wait 1', tipo: 'minicurso', salaId: 'sala-101', vagas: 1,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' },
        { inicio: '2026-10-20T09:30:00-03:00', fim: '2026-10-20T10:30:00-03:00' }
      ]
    });
    const mc2Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso Wait 2', tipo: 'minicurso', salaId: 'sala-101', vagas: 1,
      encontros: [
        { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00' },
        { inicio: '2026-10-21T09:30:00-03:00', fim: '2026-10-21T10:30:00-03:00' }
      ]
    });
    const mc3Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso Wait 3', tipo: 'minicurso', salaId: 'sala-101', vagas: 1,
      encontros: [
        { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T09:00:00-03:00' },
        { inicio: '2026-10-22T09:30:00-03:00', fim: '2026-10-22T10:30:00-03:00' }
      ]
    });

    // p-diego ocupa as únicas vagas
    await request(app).post(`/atividades/${mc1Res.body.id}/inscricoes`).set('X-Usuario', 'p-diego');
    await request(app).post(`/atividades/${mc2Res.body.id}/inscricoes`).set('X-Usuario', 'p-diego');
    await request(app).post(`/atividades/${mc3Res.body.id}/inscricoes`).set('X-Usuario', 'p-diego');

    // p-carla entra em lista de espera nos 3 minicursos
    const ins1 = await request(app).post(`/atividades/${mc1Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    const ins2 = await request(app).post(`/atividades/${mc2Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    const ins3 = await request(app).post(`/atividades/${mc3Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    expect(ins1.body.status).toBe('em_espera');
    expect(ins2.body.status).toBe('em_espera');
    expect(ins3.body.status).toBe('em_espera');

    // Cria 4º minicurso com vagas
    const mc4Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso Wait 4', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-23T08:00:00-03:00', fim: '2026-10-23T09:00:00-03:00' },
        { inicio: '2026-10-23T09:30:00-03:00', fim: '2026-10-23T10:30:00-03:00' }
      ]
    });

    // p-carla tenta se inscrever no 4º minicurso -> Aceita com 201 confirmada
    const res = await request(app)
      .post(`/atividades/${mc4Res.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmada');
  });

  it('R5 (Critério 10) — permite inscrição em minicurso quando participante tem 3 palestras confirmadas', async () => {
    // Cria 3 palestras
    const p1Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Palestra 1', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' }]
    });
    const p2Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Palestra 2', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00' }]
    });
    const p3Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Palestra 3', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T09:00:00-03:00' }]
    });

    // p-carla se inscreve e confirma nas 3 palestras
    await request(app).post(`/atividades/${p1Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${p2Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${p3Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cria 1 minicurso
    const mcRes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso Após Palestras', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-23T08:00:00-03:00', fim: '2026-10-23T09:00:00-03:00' },
        { inicio: '2026-10-23T09:30:00-03:00', fim: '2026-10-23T10:30:00-03:00' }
      ]
    });

    // p-carla tenta se inscrever no minicurso -> 201 confirmada
    const res = await request(app)
      .post(`/atividades/${mcRes.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmada');
  });

  it('R6 (Critério 11) — recusa inscrição com sobreposição de horários com 409 CONFLITO_DE_HORARIO', async () => {
    // Cria Atividade A (10:00 às 12:00)
    const atvARes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade A', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }]
    });

    // p-carla se inscreve em A
    await request(app).post(`/atividades/${atvARes.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cria Atividade B (11:00 às 13:00) na sala-102
    const atvBRes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade B', tipo: 'palestra', salaId: 'sala-102', vagas: 10,
      encontros: [{ inicio: '2026-10-20T11:00:00-03:00', fim: '2026-10-20T13:00:00-03:00' }]
    });

    // p-carla tenta se inscrever em B -> 409 CONFLITO_DE_HORARIO
    const res = await request(app)
      .post(`/atividades/${atvBRes.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('CONFLITO_DE_HORARIO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('R6 (Critério 12) — permite inscrição quando horários dos encontros apenas se encostam (ex: 14:00 e 14:00)', async () => {
    // Atividade A: 10:00 às 14:00
    const atvARes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade A', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T14:00:00-03:00' }]
    });
    await request(app).post(`/atividades/${atvARes.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Atividade B: 14:00 às 16:00 na sala-102
    const atvBRes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade B', tipo: 'palestra', salaId: 'sala-102', vagas: 10,
      encontros: [{ inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T16:00:00-03:00' }]
    });

    const res = await request(app)
      .post(`/atividades/${atvBRes.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmada');
  });

  it('R6 (Critério 13) — permite inscrição quando participante tem apenas inscrição em_espera na atividade com mesmo horário', async () => {
    // Atividade A com 1 vaga (10:00 às 12:00)
    const atvARes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade A Lotada', tipo: 'palestra', salaId: 'sala-101', vagas: 1,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }]
    });

    // p-diego ocupa a única vaga de A
    await request(app).post(`/atividades/${atvARes.body.id}/inscricoes`).set('X-Usuario', 'p-diego');

    // p-carla entra em lista de espera em A (status: em_espera)
    const insWait = await request(app).post(`/atividades/${atvARes.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(insWait.body.status).toBe('em_espera');

    // Atividade B (10:00 às 12:00) na sala-102 com vagas
    const atvBRes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade B', tipo: 'palestra', salaId: 'sala-102', vagas: 10,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }]
    });

    // p-carla se inscreve em B -> Aceita com 201 confirmada
    const res = await request(app)
      .post(`/atividades/${atvBRes.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmada');
  });

  it('R7 (Critério 14) — precedência: CONFLITO_DE_HORARIO (409) prevalece sobre LIMITE_DE_MINICURSOS (422)', async () => {
    // p-carla se inscreve em 3 minicursos
    const mc1Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso P1', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' },
        { inicio: '2026-10-20T09:30:00-03:00', fim: '2026-10-20T10:30:00-03:00' }
      ]
    });
    const mc2Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso P2', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00' },
        { inicio: '2026-10-21T09:30:00-03:00', fim: '2026-10-21T10:30:00-03:00' }
      ]
    });
    const mc3Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso P3', tipo: 'minicurso', salaId: 'sala-101', vagas: 10,
      encontros: [
        { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T09:00:00-03:00' },
        { inicio: '2026-10-22T09:30:00-03:00', fim: '2026-10-22T10:30:00-03:00' }
      ]
    });

    await request(app).post(`/atividades/${mc1Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${mc2Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');
    await request(app).post(`/atividades/${mc3Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cria Minicurso 4 que sobrepõe o horário do Minicurso 1 (2026-10-20T08:00:00-03:00)
    const mc4Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Minicurso P4 Conflitante e Acima do Limite', tipo: 'minicurso', salaId: 'sala-102', vagas: 10,
      encontros: [
        { inicio: '2026-10-20T08:00:00-03:00', fim: '2026-10-20T09:00:00-03:00' },
        { inicio: '2026-10-20T09:30:00-03:00', fim: '2026-10-20T10:30:00-03:00' }
      ]
    });

    // p-carla tenta se inscrever no 4º minicurso (viola CONFLITO_DE_HORARIO e LIMITE_DE_MINICURSOS)
    const res = await request(app)
      .post(`/atividades/${mc4Res.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // Precedência do contrato: CONFLITO_DE_HORARIO (409) vem antes de LIMITE_DE_MINICURSOS (422)
    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('CONFLITO_DE_HORARIO');
  });

  it('R7 (Critério 15) — precedência: ATIVIDADE_CANCELADA (422) prevalece sobre JA_INSCRITO (409)', async () => {
    // Cria atividade
    const atvRes = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atividade a ser cancelada', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }]
    });
    const atvId = atvRes.body.id;

    // p-carla se inscreve
    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cancela a atividade
    await request(app).post(`/atividades/${atvId}/cancelamento`).set('X-Usuario', 'org-ana');

    // p-carla tenta se inscrever novamente
    const res = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // Precedência: ATIVIDADE_CANCELADA (422) deve ser retornado antes de qualquer outra validação
    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('ATIVIDADE_CANCELADA');
  });

  it('R7 (Critério 16) — precedência: INSCRICOES_ENCERRADAS (422) prevalece sobre INSCRICAO_BLOQUEADA (422)', async () => {
    // 1. Configura o participante p-carla para ter 2 atividades encerradas no passado sem presença
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-19T08:00:00-03:00' });

    const atv1Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atv Encerrada 1', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-19T09:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }]
    });
    await request(app).post(`/atividades/${atv1Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    const atv2Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atv Encerrada 2', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-19T10:30:00-03:00', fim: '2026-10-19T11:30:00-03:00' }]
    });
    await request(app).post(`/atividades/${atv2Res.body.id}/inscricoes`).set('X-Usuario', 'p-carla');

    // Cria Atividade 3 no dia 20 com início às 10:00 (inscrições encerram às 09:30)
    const atv3Res = await request(app).post('/atividades').set('X-Usuario', 'org-ana').send({
      titulo: 'Atv Futura com Inscrições Encerradas', tipo: 'palestra', salaId: 'sala-101', vagas: 10,
      encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }]
    });
    const atv3Id = atv3Res.body.id;

    // Avança relógio para 20/10/2026 09:35:00-03:00 (inscrições encerradas E p-carla está bloqueada por faltas nas atvs 1 e 2)
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-20T09:35:00-03:00' });

    const res = await request(app)
      .post(`/atividades/${atv3Id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // Precedência do contrato: INSCRICOES_ENCERRADAS (check 3) vem antes de INSCRICAO_BLOQUEADA (check 4)
    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('INSCRICOES_ENCERRADAS');
  });

  it('R7/R20 (Critério 42) — precedência: perfil 403 SOMENTE_PARTICIPANTE prevalece sobre recurso inexistente 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .post('/atividades/atv_inexistente/inscricoes')
      .set('X-Usuario', 'org-ana');

    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('SOMENTE_PARTICIPANTE');
    expect(typeof res.body.mensagem).toBe('string');
  });
});
