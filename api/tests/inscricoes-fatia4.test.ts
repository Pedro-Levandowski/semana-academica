import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M2 - Inscrições - Fatia 4 (Cancelamentos e Integrações)', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-inscricoes-fatia4-${Date.now()}-${Math.random()}.sqlite`);
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

  it('R20 (Critério 37) — recusa cancelamento por usuário não participante com 403 SOMENTE_PARTICIPANTE', async () => {
    // 1. Cria atividade e inscrição
    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra para Cancelamento',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 5,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    const insRes = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    const insId = insRes.body.id;

    // 2. Tenta cancelar com papel organizacao (org-ana)
    const cancelOrg = await request(app)
      .post(`/inscricoes/${insId}/cancelamento`)
      .set('X-Usuario', 'org-ana');

    expect(cancelOrg.status).toBe(403);
    expect(cancelOrg.body.erro).toBe('SOMENTE_PARTICIPANTE');
  });

  it('R19, R20 — recusa cancelamento em inscrição inexistente ou de outro participante com 404 NAO_ENCONTRADO', async () => {
    // 1. Tenta cancelar inscrição inexistente
    const resInexistente = await request(app)
      .post('/inscricoes/ins_99999999/cancelamento')
      .set('X-Usuario', 'p-carla');

    expect(resInexistente.status).toBe(404);
    expect(resInexistente.body.erro).toBe('NAO_ENCONTRADO');

    // 2. Cria inscrição para p-carla e tenta cancelar usando participante p-diego
    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Outro Participante',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 5,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    const insRes = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    const insId = insRes.body.id;

    const resOutro = await request(app)
      .post(`/inscricoes/${insId}/cancelamento`)
      .set('X-Usuario', 'p-diego');

    expect(resOutro.status).toBe(404);
    expect(resOutro.body.erro).toBe('NAO_ENCONTRADO');
  });

  it('R16 (Critério 28) — recusa cancelamento em inscrição já cancelada ou expirada com 422 INSCRICAO_INATIVA', async () => {
    // 1. Relógio em 10:00:00 do dia 19.
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Inativa Teste',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T18:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    // p-fabio confirmada, p-carla em espera
    await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');

    // Libera vaga -> p-carla convocada até 12:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // Avança relógio para 12:00:00 -> p-carla expira
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    // Tenta cancelar inscrição expirada de p-carla
    const cancelExpirada = await request(app)
      .post(`/inscricoes/${insCarla.body.id}/cancelamento`)
      .set('X-Usuario', 'p-carla');

    expect(cancelExpirada.status).toBe(422);
    expect(cancelExpirada.body.erro).toBe('INSCRICAO_INATIVA');

    // Agora p-fabio cancela uma vez
    const cancelFabio1 = await request(app)
      .post(`/inscricoes/${(await request(app).get(`/inscricoes?atividadeId=${atvId}`).set('X-Usuario', 'p-fabio')).body[0].id}/cancelamento`)
      .set('X-Usuario', 'p-fabio');

    expect(cancelFabio1.status).toBe(200);
    expect(cancelFabio1.body.status).toBe('cancelada');

    // p-fabio tenta cancelar novamente (agora cancelada)
    const cancelFabio2 = await request(app)
      .post(`/inscricoes/${cancelFabio1.body.id}/cancelamento`)
      .set('X-Usuario', 'p-fabio');

    expect(cancelFabio2.status).toBe(422);
    expect(cancelFabio2.body.erro).toBe('INSCRICAO_INATIVA');
  });

  it('R15 (Critério 27) — recusa cancelamento no instante exato do início do primeiro encontro ou após com 422 ATIVIDADE_JA_INICIADA', async () => {
    // 1. Relógio em 10:00:00. Atividade com 1º encontro às 14:00:00.
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Inicio Teste',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 5,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    const insCarla = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    const insId = insCarla.body.id;

    // Avança o relógio para exatamente 14:00:00 (instante de início)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T14:00:00-03:00' });

    // Tenta cancelar no início exato
    const cancelExato = await request(app)
      .post(`/inscricoes/${insId}/cancelamento`)
      .set('X-Usuario', 'p-carla');

    expect(cancelExato.status).toBe(422);
    expect(cancelExato.body.erro).toBe('ATIVIDADE_JA_INICIADA');

    // Avança relógio para 14:05:00 (após início)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T14:05:00-03:00' });

    const cancelApos = await request(app)
      .post(`/inscricoes/${insId}/cancelamento`)
      .set('X-Usuario', 'p-carla');

    expect(cancelApos.status).toBe(422);
    expect(cancelApos.body.erro).toBe('ATIVIDADE_JA_INICIADA');
  });

  it('R15 (Critério 26) — cancela inscrição ativa antes do início do 1º encontro', async () => {
    // 1. Relógio em 10:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Cancelamento Sucesso',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 5,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    const insCarla = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    const insId = insCarla.body.id;

    expect(insCarla.body.status).toBe('confirmada');

    // Relógio em 13:59:59 (falta 1s para o início da atividade)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T13:59:59-03:00' });

    const cancelRes = await request(app)
      .post(`/inscricoes/${insId}/cancelamento`)
      .set('X-Usuario', 'p-carla');

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.id).toBe(insId);
    expect(cancelRes.body.status).toBe('cancelada');
    expect(cancelRes.body.posicaoNaEspera).toBeNull();
    expect(cancelRes.body.convocadaAte).toBeNull();

    // Consulta individual confirmando persistentemente
    const getRes = await request(app)
      .get(`/inscricoes/${insId}`)
      .set('X-Usuario', 'p-carla');

    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('cancelada');
  });

  it('R8, R9 — convoca automático ao cancelar confirmada e reordena fila ao cancelar em_espera', async () => {
    // 1. Relógio em 10:00:00. Atividade 1º encontro às 16:00:00 (encerramento 15:30)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Efeitos Cancelamento',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T17:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    // p-fabio -> confirmada (vaga 1)
    const insFabio = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    // p-carla -> em_espera (posicao 1)
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');
    // p-diego -> em_espera (posicao 2)
    const insDiego = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-diego');
    // p-elisa -> em_espera (posicao 3)
    const insElisa = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-elisa');

    expect(insCarla.body.posicaoNaEspera).toBe(1);
    expect(insDiego.body.posicaoNaEspera).toBe(2);
    expect(insElisa.body.posicaoNaEspera).toBe(3);

    // p-diego (posicao 2) cancela sua inscrição em espera às 11:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T11:00:00-03:00' });

    const cancelDiego = await request(app)
      .post(`/inscricoes/${insDiego.body.id}/cancelamento`)
      .set('X-Usuario', 'p-diego');

    expect(cancelDiego.status).toBe(200);
    expect(cancelDiego.body.status).toBe('cancelada');

    // p-carla continua posicao 1, p-elisa passa para posicao 2 (R8)
    const getElisa1 = await request(app).get(`/inscricoes/${insElisa.body.id}`).set('X-Usuario', 'p-elisa');
    expect(getElisa1.body.posicaoNaEspera).toBe(2);

    // p-fabio cancela sua inscrição confirmada às 11:30:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T11:30:00-03:00' });

    const cancelFabio = await request(app)
      .post(`/inscricoes/${insFabio.body.id}/cancelamento`)
      .set('X-Usuario', 'p-fabio');

    expect(cancelFabio.status).toBe(200);
    expect(cancelFabio.body.status).toBe('cancelada');

    // Vaga foi liberada -> p-carla (posicao 1) deve ter sido convocada com convocadaAte 13:30:00 (11:30 + 2h)
    const getCarla = await request(app).get(`/inscricoes/${insCarla.body.id}`).set('X-Usuario', 'p-carla');
    expect(getCarla.body.status).toBe('convocada');
    expect(getCarla.body.posicaoNaEspera).toBeNull();
    expect(getCarla.body.convocadaAte).toBe('2026-10-19T13:30:00-03:00');

    // p-elisa agora passa para posicaoNaEspera 1
    const getElisa2 = await request(app).get(`/inscricoes/${insElisa.body.id}`).set('X-Usuario', 'p-elisa');
    expect(getElisa2.body.status).toBe('em_espera');
    expect(getElisa2.body.posicaoNaEspera).toBe(1);
  });

  it('R17 (Critério 29) — ao cancelar atividade no M1 via POST /atividades/:id/cancelamento, cancela automaticamente todas as inscrições ativas sem alterar inativas', async () => {
    // 1. Relógio em 10:00:00. Atividade com 1º encontro às 18:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });

    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra M1 Cancelada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T18:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' }
        ]
      });
    const atvId = atvRes.body.id;

    // p-fabio -> confirmada
    const insFabio = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-fabio');
    // p-carla -> em_espera
    const insCarla = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-carla');
    // p-diego -> em_espera
    const insDiego = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-diego');

    // Libera vaga às 10:00:00 -> p-carla convocada até 12:00:00
    await request(app)
      .patch(`/atividades/${atvId}`)
      .set('X-Usuario', 'org-ana')
      .send({ vagas: 2 });

    // Avança para 12:00:00 -> p-carla expira, p-diego convocado até 14:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T12:00:00-03:00' });

    // p-elisa entra em espera
    const insElisa = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-elisa');

    // Estado antes do cancelamento da atividade:
    // insFabio: confirmada (ativa)
    // insCarla: expirada (inativa)
    // insDiego: convocada (ativa)
    // insElisa: em_espera (ativa)

    // p-gabriela decide cancelar sua própria inscrição manualmente (já fica cancelada/inativa antes do cancelamento da atividade)
    const insGabriela = await request(app).post(`/atividades/${atvId}/inscricoes`).set('X-Usuario', 'p-gabriela');
    await request(app).post(`/inscricoes/${insGabriela.body.id}/cancelamento`).set('X-Usuario', 'p-gabriela');

    // M1 cancela a atividade às 13:00:00
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T13:00:00-03:00' });

    const cancelAtvRes = await request(app)
      .post(`/atividades/${atvId}/cancelamento`)
      .set('X-Usuario', 'org-ana');

    expect(cancelAtvRes.status).toBe(200);
    expect(cancelAtvRes.body.situacao).toBe('cancelada');

    // Consulta todas as inscrições como org-ana
    const listRes = await request(app)
      .get(`/inscricoes?atividadeId=${atvId}`)
      .set('X-Usuario', 'org-ana');

    expect(listRes.status).toBe(200);

    const fabioIns = listRes.body.find((i: any) => i.id === insFabio.body.id);
    const carlaIns = listRes.body.find((i: any) => i.id === insCarla.body.id);
    const diegoIns = listRes.body.find((i: any) => i.id === insDiego.body.id);
    const elisaIns = listRes.body.find((i: any) => i.id === insElisa.body.id);
    const gabrielaIns = listRes.body.find((i: any) => i.id === insGabriela.body.id);

    // Inscrições ativas (confirmada, convocada, em_espera) mudaram para "cancelada", com null em posicao e convocadaAte
    expect(fabioIns.status).toBe('cancelada');
    expect(fabioIns.posicaoNaEspera).toBeNull();
    expect(fabioIns.convocadaAte).toBeNull();

    expect(diegoIns.status).toBe('cancelada');
    expect(diegoIns.posicaoNaEspera).toBeNull();
    expect(diegoIns.convocadaAte).toBeNull();

    expect(elisaIns.status).toBe('cancelada');
    expect(elisaIns.posicaoNaEspera).toBeNull();
    expect(elisaIns.convocadaAte).toBeNull();

    // Inscrições inativas (expirada, cancelada anteriormente) NÃO mudam
    expect(carlaIns.status).toBe('expirada');
    expect(gabrielaIns.status).toBe('cancelada');
  });
});
