import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

describe('M2 - Inscrições - Fatia 1', () => {
  let app: any;
  let dbPath: string;

  beforeEach(async () => {
    const tmpDir = os.tmpdir();
    dbPath = path.join(tmpDir, `test-inscricoes-${Date.now()}-${Math.random()}.sqlite`);
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

  it('R1 — realiza inscrição confirmada em atividade com vagas disponíveis', async () => {
    // 1. Cria uma atividade com 20 vagas
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra de Teste Fatia 1',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    expect(atividadeRes.status).toBe(201);
    const atividadeId = atividadeRes.body.id;

    // 2. Participante realiza inscrição
    const res = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^ins_[0-9a-f]{8}$/);
    expect(res.body.atividadeId).toBe(atividadeId);
    expect(res.body.participanteId).toBe('p-carla');
    expect(res.body.status).toBe('confirmada');
    expect(res.body.posicaoNaEspera).toBeNull();
    expect(res.body.convocadaAte).toBeNull();
    expect(typeof res.body.criadaEm).toBe('string');
  });

  it('R2 — recusa inscrição realizada 30 minutos antes do primeiro encontro com 422 INSCRICOES_ENCERRADAS', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Encerramento',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const atividadeId = atividadeRes.body.id;

    // Relógio em exatamente 30 minutos antes (09:30:00-03:00)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:30:00-03:00' });

    const res30m = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res30m.status).toBe(422);
    expect(res30m.body.erro).toBe('INSCRICOES_ENCERRADAS');
    expect(typeof res30m.body.mensagem).toBe('string');

    // Relógio em 30 minutos e 1 segundo antes (09:29:59-03:00) -> Aceita
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T09:29:59-03:00' });

    const res29m59s = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-diego');

    expect(res29m59s.status).toBe(201);
  });

  it('R3 — recusa inscrição duplicada de participante ativo com 409 JA_INSCRITO', async () => {
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Inscrição Duplicada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const atividadeId = atividadeRes.body.id;

    // Primeira inscrição -> Sucesso
    const res1 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    expect(res1.status).toBe(201);

    // Segunda tentativa pelo mesmo participante -> Recusa 409 JA_INSCRITO
    const res2 = await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(res2.status).toBe(409);
    expect(res2.body.erro).toBe('JA_INSCRITO');
    expect(typeof res2.body.mensagem).toBe('string');
  });

  it('R3 (Critério 6) — permite re-inscrição de participante com inscrição anterior cancelada ou expirada, inserindo ao final da fila ou como confirmada', async () => {
    // 1. Cria atividade com 1 vaga
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Re-Inscrição',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

    const atvId = atividadeRes.body.id;

    // Participante p-carla se inscreve (confirmada)
    const ins1 = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    expect(ins1.status).toBe(201);
    expect(ins1.body.status).toBe('confirmada');

    // Participante p-diego se inscreve (entra na espera: posicao 1)
    const ins2 = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-diego');
    expect(ins2.status).toBe(201);
    expect(ins2.body.status).toBe('em_espera');
    expect(ins2.body.posicaoNaEspera).toBe(1);

    // p-carla cancela sua inscrição -> p-diego é convocado automaticamente (convocada)
    await request(app)
      .post(`/inscricoes/${ins1.body.id}/cancelamento`)
      .set('X-Usuario', 'p-carla');

    // p-carla (cuja inscrição anterior foi cancelada) se inscreve novamente
    const reInsCarla = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    expect(reInsCarla.status).toBe(201);
    expect(reInsCarla.body.status).toBe('em_espera');
    expect(reInsCarla.body.posicaoNaEspera).toBe(1);

    // Agora testa re-inscrição de participante cuja convocação expirou:
    // Relógio avança para expirar convocação de p-diego (convocadaAte = +2h)
    await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T05:00:00-03:00' });

    // p-diego tenta se inscrever novamente após ter convocação expirada
    const reInsDiego = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-diego');

    expect(reInsDiego.status).toBe(201);
    expect(['confirmada', 'em_espera']).toContain(reInsDiego.body.status);
  });

  it('R18 — lista inscrições filtrando por perfil do usuário e por atividadeId', async () => {
    // Cria Atividade 1
    const atv1Res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra A',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
      });
    const atv1Id = atv1Res.body.id;

    // Cria Atividade 2
    const atv2Res = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra B',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 20,
        encontros: [{ inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }]
      });
    const atv2Id = atv2Res.body.id;

    // p-carla se inscreve em atv1
    await request(app)
      .post(`/atividades/${atv1Id}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    // p-diego se inscreve em atv2
    await request(app)
      .post(`/atividades/${atv2Id}/inscricoes`)
      .set('X-Usuario', 'p-diego');

    // Participante p-carla lista suas inscrições
    const resCarla = await request(app)
      .get('/inscricoes')
      .set('X-Usuario', 'p-carla');
    expect(resCarla.status).toBe(200);
    expect(Array.isArray(resCarla.body)).toBe(true);
    expect(resCarla.body.length).toBe(1);
    expect(resCarla.body[0].participanteId).toBe('p-carla');
    expect(resCarla.body[0].atividadeId).toBe(atv1Id);

    // Organização org-ana lista todas as inscrições
    const resOrg = await request(app)
      .get('/inscricoes')
      .set('X-Usuario', 'org-ana');
    expect(resOrg.status).toBe(200);
    expect(Array.isArray(resOrg.body)).toBe(true);
    expect(resOrg.body.length).toBe(2);

    // Filtro por atividadeId
    const resFilter = await request(app)
      .get(`/inscricoes?atividadeId=${atv1Id}`)
      .set('X-Usuario', 'org-ana');
    expect(resFilter.status).toBe(200);
    expect(resFilter.body.length).toBe(1);
    expect(resFilter.body[0].atividadeId).toBe(atv1Id);
  });

  it('R19 — permite consulta individual pelo dono ou organização, e retorna 404 para outro participante', async () => {
    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Consulta Individual',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 20,
        encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
      });

    const atvId = atvRes.body.id;

    // p-carla se inscreve
    const insRes = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');
    const inscricaoId = insRes.body.id;

    // p-carla (dono) consulta sua própria inscrição -> 200
    const resCarla = await request(app)
      .get(`/inscricoes/${inscricaoId}`)
      .set('X-Usuario', 'p-carla');
    expect(resCarla.status).toBe(200);
    expect(resCarla.body.id).toBe(inscricaoId);
    expect(resCarla.body.participanteId).toBe('p-carla');

    // p-diego (outro participante) consulta inscrição de p-carla -> 404 NAO_ENCONTRADO
    const resDiego = await request(app)
      .get(`/inscricoes/${inscricaoId}`)
      .set('X-Usuario', 'p-diego');
    expect(resDiego.status).toBe(404);
    expect(resDiego.body.erro).toBe('NAO_ENCONTRADO');

    // org-ana (organização) consulta a inscrição -> 200
    const resOrg = await request(app)
      .get(`/inscricoes/${inscricaoId}`)
      .set('X-Usuario', 'org-ana');
    expect(resOrg.status).toBe(200);
    expect(resOrg.body.id).toBe(inscricaoId);
  });

  it('R20 — recusa tentativa de inscrição feita pela organização com 403 SOMENTE_PARTICIPANTE, mesmo em atividade inexistente', async () => {
    // Organização tenta se inscrever em atividade inexistente
    const resOrg = await request(app)
      .post('/atividades/atv_inexistente/inscricoes')
      .set('X-Usuario', 'org-ana');

    expect(resOrg.status).toBe(403);
    expect(resOrg.body.erro).toBe('SOMENTE_PARTICIPANTE');
    expect(typeof resOrg.body.mensagem).toBe('string');

    // Requisição sem cabeçalho X-Usuario
    const resNoUser = await request(app)
      .post('/atividades/atv_inexistente/inscricoes');

    expect(resNoUser.status).toBe(401);
    expect(resNoUser.body.erro).toBe('USUARIO_DESCONHECIDO');
  });

  it('R21 — atualiza a contagem de ocupadas, vagasRestantes e emEspera consultadas pelo M1', async () => {
    // Cria atividade com 2 vagas
    const atividadeRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra com 2 Vagas',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 2,
        encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
      });

    const atvId = atividadeRes.body.id;

    // Antes das inscrições: ocupadas 0, vagasRestantes 2, emEspera 0
    const get0 = await request(app)
      .get(`/atividades/${atvId}`)
      .set('X-Usuario', 'p-carla');
    expect(get0.body.ocupadas).toBe(0);
    expect(get0.body.vagasRestantes).toBe(2);
    expect(get0.body.emEspera).toBe(0);

    // 1ª Inscrição (p-carla) -> Ocupa vaga
    await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-carla');

    const get1 = await request(app)
      .get(`/atividades/${atvId}`)
      .set('X-Usuario', 'p-carla');
    expect(get1.body.ocupadas).toBe(1);
    expect(get1.body.vagasRestantes).toBe(1);
    expect(get1.body.emEspera).toBe(0);

    // 2ª Inscrição (p-diego) -> Ocupa vaga
    await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-diego');

    const get2 = await request(app)
      .get(`/atividades/${atvId}`)
      .set('X-Usuario', 'p-carla');
    expect(get2.body.ocupadas).toBe(2);
    expect(get2.body.vagasRestantes).toBe(0);
    expect(get2.body.emEspera).toBe(0);

    // 3ª Inscrição (p-elisa) -> Vai para lista de espera
    const ins3 = await request(app)
      .post(`/atividades/${atvId}/inscricoes`)
      .set('X-Usuario', 'p-elisa');
    expect(ins3.status).toBe(201);
    expect(ins3.body.status).toBe('em_espera');
    expect(ins3.body.posicaoNaEspera).toBe(1);

    // M1 consulta a atividade e obtém ocupadas: 2, vagasRestantes: 0, emEspera: 1
    const get3 = await request(app)
      .get(`/atividades/${atvId}`)
      .set('X-Usuario', 'p-carla');
    expect(get3.body.ocupadas).toBe(2);
    expect(get3.body.vagasRestantes).toBe(0);
    expect(get3.body.emEspera).toBe(1);
  });

  it('R22 (Critério 39) — recusa tentativa de inscrição por participante em atividade inexistente com 404 NAO_ENCONTRADO', async () => {
    const res = await request(app)
      .post('/atividades/atv_inexistente/inscricoes')
      .set('X-Usuario', 'p-carla');

    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('NAO_ENCONTRADO');
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('R22 — recusa requisição de inscrição com corpo JSON malformado com 422 DADOS_INVALIDOS', async () => {
    const atvRes = await request(app)
      .post('/atividades')
      .set('X-Usuario', 'org-ana')
      .send({
        titulo: 'Palestra Corpo Malformado',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 10,
        encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }]
      });

    const res = await request(app)
      .post(`/atividades/${atvRes.body.id}/inscricoes`)
      .set('X-Usuario', 'p-carla')
      .set('Content-Type', 'application/json')
      .send('{ malformed json');

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('DADOS_INVALIDOS');
    expect(typeof res.body.mensagem).toBe('string');
  });
});
