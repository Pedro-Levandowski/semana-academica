import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M2 - Inscrições - Fatia 3', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-inscricoes-fatia3-${Date.now()}-${Math.random()}.sqlite`);
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

  it('Fatia 3 — pré-condição: cria inscrição em_espera para testar posicaoNaEspera', async () => {
    // 1. Cria atividade com 1 vaga
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Fila de Espera',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const atividadeId = atividadeRes.body.id;

    // 2. Primeira inscrição ocupa a vaga (confirmada)
    const ins1 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    expect(ins1.status).toBe(201);
    expect(ins1.body.status).toBe('confirmada');

    // 3. Segunda inscrição entra na fila de espera (posicao 1)
    const ins2 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-diego');

    expect(ins2.status).toBe(201);
    expect(ins2.body.status).toBe('em_espera');
    expect(ins2.body.posicaoNaEspera).toBe(1);
    expect(ins2.body.convocadaAte).toBeNull();

    // 4. Terceira inscrição entra na fila de espera (posicao 2)
    const ins3 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-elisa');

    expect(ins3.status).toBe(201);
    expect(ins3.body.status).toBe('em_espera');
    expect(ins3.body.posicaoNaEspera).toBe(2);
    expect(ins3.body.convocadaAte).toBeNull();
  });

  it('R8 — calcula posicaoNaEspera sequencial (1, 2, 3...) baseada na ordem de criação', async () => {
    // 1. Cria atividade com 1 vaga (a partir da 2a inscrição entra em espera)
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Com 1 Vaga',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' },
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const atvId = atividadeRes.body.id;

    // Inscrição 0 -> Confirmada (ocupa a vaga)
    const ins0 = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    expect(ins0.status).toBe(201);
    expect(ins0.body.status).toBe('confirmada');

    // Inscrições 1, 2, 3 -> Entram em espera
    const ins1 = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');
    const ins2 = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-diego');
    const ins3 = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-elisa');

    expect(ins1.body.posicaoNaEspera).toBe(1);
    expect(ins2.body.posicaoNaEspera).toBe(2);
    expect(ins3.body.posicaoNaEspera).toBe(3);

    // Consulta GET /inscricoes como org-ana
    const listRes = await request(app)
      .get(`/inscricoes?atividadeId=${atvId}`)
      .set('X-Usuario', 'org-ana');

    expect(listRes.status).toBe(200);
    const carlaIns = listRes.body.find((i: any) => i.participanteId === 'p-carla');
    const diegoIns = listRes.body.find((i: any) => i.participanteId === 'p-diego');
    const elisaIns = listRes.body.find((i: any) => i.participanteId === 'p-elisa');

    expect(carlaIns.posicaoNaEspera).toBe(1);
    expect(diegoIns.posicaoNaEspera).toBe(2);
    expect(elisaIns.posicaoNaEspera).toBe(3);
  });

  it('R9, R10 — convoca o 1º da fila de espera quando vaga é liberada e define convocadaAte para 2h depois', async () => {
    // 1. Define o relógio para 2026-10-19 10:00:00-03:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    // 2. Cria atividade com 1 vaga, 1º encontro às 15:00 (encerramento das inscrições às 14:30)
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Convocação Auto',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T15:00:00-03:00', fim: '2026-10-19T16:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    // p-fabio se inscreve -> confirmada
    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');

    // p-carla se inscreve -> em_espera (posicao 1)
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(insCarla.body.status).toBe('em_espera');

    // org-ana aumenta vagas para 2 -> Libera 1 vaga às 10:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // Consulta inscrição de p-carla -> deve estar convocada com convocadaAte 12:00:00
    const checkCarla = await request(app)
      .get(`/inscricoes/${insCarla.body.id}`)
      .set('X-Usuario', 'p-carla');

    expect(checkCarla.status).toBe(200);
    expect(checkCarla.body.status).toBe('convocada');
    expect(checkCarla.body.posicaoNaEspera).toBeNull();
    expect(checkCarla.body.convocadaAte).toBe('2026-10-19T12:00:00-03:00');
  });

  it('R10 — trunca convocadaAte no limite de encerramento quando restam menos de 2h, e não convoca após o encerramento', async () => {
    // 1. Relógio em 14:00. Atividade 1º encontro às 16:00 (encerramento das inscrições às 15:30)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T14:00:00-03:00' });

    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Truncada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    // p-fabio se inscreve -> confirmada
    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');

    // p-carla se inscreve -> em_espera
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');

    // p-diego se inscreve -> em_espera (posicao 2)
    const insDiego = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-diego');

    // Liberamos 1 vaga às 14:00. Restam 1h30min até 15:30.
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // p-carla deve ter sido convocada com convocadaAte = 15:30:00 (truncado)
    const checkCarla = await request(app)
      .get(`/inscricoes/${insCarla.body.id}`)
      .set('X-Usuario', 'p-carla');

    expect(checkCarla.body.status).toBe('convocada');
    expect(checkCarla.body.convocadaAte).toBe('2026-10-19T15:30:00-03:00');

    // Agora avançamos o relógio para 15:31 (após encerramento)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T15:31:00-03:00' });

    // A convocação de p-carla (15:30) já expirou!
    // Liberamos mais 1 vaga (vagas = 3) às 15:31
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 3 });

    // p-diego não deve ser convocado, pois agora >= 15:30
    const checkDiego = await request(app)
      .get(`/inscricoes/${insDiego.body.id}`)
      .set('X-Usuario', 'p-diego');

    expect(checkDiego.body.status).toBe('em_espera');
    expect(checkDiego.body.convocadaAte).toBeNull();
  });

  it('R11 — expira convocação não confirmada ao atingir convocadaAte e convoca o próximo da fila em cascata', async () => {
    // 1. Relógio em 10:00:00. Atividade com 1º encontro às 18:00 (encerramento 17:30)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Cascata',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T18:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio'); // confirmada
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla'); // espera 1
    const insDiego = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-diego'); // espera 2

    // Libera vaga às 10:00:00 -> p-carla convocada até 12:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    const checkCarla10 = await request(app)
      .get(`/inscricoes/${insCarla.body.id}`)
      .set('X-Usuario', 'p-carla');
    expect(checkCarla10.body.status).toBe('convocada');
    expect(checkCarla10.body.convocadaAte).toBe('2026-10-19T12:00:00-03:00');

    // Avança relógio para 12:00:00 (momento exato da expiração de p-carla)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    // Consulta p-carla -> expirada
    const checkCarla12 = await request(app)
      .get(`/inscricoes/${insCarla.body.id}`)
      .set('X-Usuario', 'p-carla');

    expect(checkCarla12.body.status).toBe('expirada');
    expect(checkCarla12.body.convocadaAte).toBeNull();

    // Consulta p-diego -> convocado em cascata até 14:00:00
    const checkDiego12 = await request(app)
      .get(`/inscricoes/${insDiego.body.id}`)
      .set('X-Usuario', 'p-diego');

    expect(checkDiego12.body.status).toBe('convocada');
    expect(checkDiego12.body.posicaoNaEspera).toBeNull();
    expect(checkDiego12.body.convocadaAte).toBe('2026-10-19T14:00:00-03:00');
  });

  it('R12 — confirma convocação válida dentro do prazo e sem conflitos', async () => {
    // 1. Relógio em 10:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Confirmação Sucesso',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T18:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio'); // confirmada
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla'); // espera 1

    // Libera vaga às 10:00:00 -> p-carla convocada até 12:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // p-carla confirma sua vaga às 10:30:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:30:00-03:00' });

    const confirmRes = await request(app)
      .post(`/inscricoes/${insCarla.body.id}/confirmacao`)
      .set('X-Usuario', 'p-carla');

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.id).toBe(insCarla.body.id);
    expect(confirmRes.body.status).toBe('confirmada');
    expect(confirmRes.body.posicaoNaEspera).toBeNull();
    expect(confirmRes.body.convocadaAte).toBeNull();
  });

  it('R13 — recusa confirmação sem convocação (SEM_CONVOCACAO) ou expirada (CONVOCACAO_EXPIRADA)', async () => {
    // 1. Relógio em 10:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Teste Erros Confirmação',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T18:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    // p-fabio -> confirmada
    const insFabio = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    // p-carla -> em_espera
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');

    // Tentativa 1: p-fabio tenta confirmar inscrição que já está "confirmada" -> 422 SEM_CONVOCACAO
    const errFabio = await request(app)
      .post(`/inscricoes/${insFabio.body.id}/confirmacao`)
      .set('X-Usuario', 'p-fabio');

    expect(errFabio.status).toBe(422);
    expect(errFabio.body.erro).toBe('SEM_CONVOCACAO');

    // Tentativa 2: p-carla tenta confirmar inscrição que está "em_espera" -> 422 SEM_CONVOCACAO
    const errCarlaEspera = await request(app)
      .post(`/inscricoes/${insCarla.body.id}/confirmacao`)
      .set('X-Usuario', 'p-carla');

    expect(errCarlaEspera.status).toBe(422);
    expect(errCarlaEspera.body.erro).toBe('SEM_CONVOCACAO');

    // Libera vaga às 10:00 -> p-carla convocada até 12:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // Avança relógio para 12:00:01 (prazo expirou)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:01-03:00' });

    // Tentativa 3: p-carla tenta confirmar convocação já expirada -> 422 CONVOCACAO_EXPIRADA
    const errCarlaExpirada = await request(app)
      .post(`/inscricoes/${insCarla.body.id}/confirmacao`)
      .set('X-Usuario', 'p-carla');

    expect(errCarlaExpirada.status).toBe(422);
    expect(errCarlaExpirada.body.erro).toBe('CONVOCACAO_EXPIRADA');
  });

  it('R14 — revalida regras ao confirmar convocação e mantém status convocada e prazo inalterados ao falhar', async () => {
    // 1. Relógio em 10:00:00 do dia 19
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    // Cria Atividade A (2 encontros, minicurso no dia 20 das 10h às 12h)
    const atvARes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Conflito A',
        tipo: 'minicurso',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' },
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }
        ]
      });
    const atvAId = atvARes.body.id;

    // p-fabio ocupa a vaga em A -> confirmada
    await request(app).post(`/atividades/${atvAId}/inscricoes`).set('X-Usuario', 'p-fabio');
    // p-carla entra em espera em A (em_espera não valida nem gera conflito)
    const insCarlaA = await request(app).post(`/atividades/${atvAId}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(insCarlaA.body.status).toBe('em_espera');

    // Cria Atividade B (mesmo horário dia 20 das 10h às 12h) com vaga livre
    const atvBRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Minicurso Conflito B',
        tipo: 'minicurso',
        salaId: 'sala-102',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' },
          { inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }
        ]
      });
    const atvBId = atvBRes.body.id;

    // p-carla se inscreve em B (ocupando vaga) -> confirmada em B
    const insCarlaB = await request(app).post(`/atividades/${atvBId}/inscricoes`).set('X-Usuario', 'p-carla');
    expect(insCarlaB.status).toBe(201);
    expect(insCarlaB.body.status).toBe('confirmada');

    // Libera vaga em A -> p-carla é convocada em A (convocada até 12:00:00)
    await request(app)
      .patch(`/atividades/${atvAId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // p-carla tenta confirmar a convocação em A -> deve falhar com 409 CONFLITO_DE_HORARIO
    const confirmConflict = await request(app)
      .post(`/inscricoes/${insCarlaA.body.id}/confirmacao`)
      .set('X-Usuario', 'p-carla');

    expect(confirmConflict.status).toBe(409);
    expect(confirmConflict.body.erro).toBe('CONFLITO_DE_HORARIO');

    // MANTÉM a inscrição em A como "convocada" e com convocadaAte inalterado
    const checkCarlaA = await request(app)
      .get(`/inscricoes/${insCarlaA.body.id}`)
      .set('X-Usuario', 'p-carla');

    expect(checkCarlaA.status).toBe(200);
    expect(checkCarlaA.body.status).toBe('convocada');
    expect(checkCarlaA.body.convocadaAte).toBe('2026-10-19T12:00:00-03:00');
  });

  it('R20 (Critério 36) — recusa confirmação de convocação feita por usuário com papel organizacao com 403 SOMENTE_PARTICIPANTE', async () => {
    // 1. Cria atividade e convocação
    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra para Confirmar por Org',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    // p-fabio -> confirmada
    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    // p-carla -> em_espera
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');

    // Libera vaga -> p-carla é convocada
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // Organização (org-ana) tenta confirmar a inscrição do participante
    const resOrg = await request(app)
      .post(`/inscricoes/${insCarla.body.id}/confirmacao`)
      .set('X-Usuario', 'org-ana');

    expect(resOrg.status).toBe(403);
    expect(resOrg.body.erro).toBe('SOMENTE_PARTICIPANTE');
    expect(typeof resOrg.body.mensagem).toBe('string');
  });
});
