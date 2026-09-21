import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const OUTRO_PARTICIPANTE = 'p-diego';
const ORGANIZACAO = 'org-ana';

describe('M4 - Certificados - Fatia 4 (GET /extrato)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  async function resetar() {
    const res = await request(app).post('/_teste/reset');
    expect(res.status).toBe(204);
  }

  async function definirRelogio(agora: string) {
    const res = await request(app).put('/_teste/relogio').send({ agora });
    expect(res.status).toBe(200);
  }

  async function criarAtividade(dados: {
    titulo: string;
    tipo: 'palestra' | 'minicurso';
    salaId: string;
    vagas: number;
    encontros: Array<{ inicio: string; fim: string }>;
  }) {
    const res = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send(dados);
    expect(res.status).toBe(201);
    return res.body;
  }

  function inscrever(atividadeId: string, participante: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', participante);
  }

  function consultarExtrato(participante = PARTICIPANTE) {
    return request(app).get('/extrato').set('X-Usuario', participante);
  }

  async function registrarPresenca(dia: number, encontros: Array<{ id: string; inicio: string }>) {
    const encontro = encontros.find((enc) => enc.inicio.startsWith(`2026-10-${dia}T`));
    if (!encontro) return;
    await definirRelogio(`2026-10-${dia}T19:30:00-03:00`);
    const codigoRes = await request(app)
      .get(`/encontros/${encontro.id}/codigo`)
      .set('X-Usuario', ORGANIZACAO);
    expect(codigoRes.status).toBe(200);
    const codigo = codigoRes.body.codigo;
    const presencaRes = await request(app)
      .post(`/encontros/${encontro.id}/presencas`)
      .set('X-Usuario', PARTICIPANTE)
      .send({ codigo });
    expect(presencaRes.status).toBe(201);
  }

  describe('autorização conforme contrato (identificado e somente participante)', () => {
    it('retorna 200 com o corpo Extrato do contrato para participante autenticado', async () => {
      await resetar();

      const res = await consultarExtrato();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('itens');
      expect(Array.isArray(res.body.itens)).toBe(true);
      expect(typeof res.body.palestrasMinutos).toBe('number');
      expect(typeof res.body.minicursosMinutos).toBe('number');
      expect(typeof res.body.totalMinutos).toBe('number');
      expect(typeof res.body.aproveitadoMinutos).toBe('number');
    });

    it('retorna 401 USUARIO_DESCONHECIDO sem o cabeçalho X-Usuario', async () => {
      const res = await request(app).get('/extrato');

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('retorna 403 SOMENTE_PARTICIPANTE para usuário de organização', async () => {
      const res = await request(app).get('/extrato').set('X-Usuario', ORGANIZACAO);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('SOMENTE_PARTICIPANTE');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('R10/R13 — composição dos itens (codigo preenchido ou null)', () => {
    it('R10/R13: atividade com inscrição confirmada e certificado emitido aparece com codigo preenchido; atividade elegível sem certificado aparece com codigo null', async () => {
      await resetar();

      const minicurso = await criarAtividade({
        titulo: 'Minicurso com certificado',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      const palestra = await criarAtividade({
        titulo: 'Palestra sem certificado',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-21T14:00:00-03:00', fim: '2026-10-21T15:00:00-03:00' }
        ]
      });

      const insMinicurso = await inscrever(minicurso.id, PARTICIPANTE);
      expect(insMinicurso.status).toBe(201);
      expect(insMinicurso.body.status).toBe('confirmada');

      const insPalestra = await inscrever(palestra.id, PARTICIPANTE);
      expect(insPalestra.status).toBe(201);
      expect(insPalestra.body.status).toBe('confirmada');

      for (const dia of [19, 20]) {
        await registrarPresenca(dia, minicurso.encontros);
      }

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const emitido = await request(app)
        .post(`/atividades/${minicurso.id}/certificado`)
        .set('X-Usuario', PARTICIPANTE);
      expect(emitido.status).toBe(201);

      const res = await consultarExtrato();
      expect(res.status).toBe(200);

      const itemMinicurso = res.body.itens.find((i: any) => i.atividadeId === minicurso.id);
      expect(itemMinicurso).toBeDefined();
      expect(itemMinicurso.titulo).toBe('Minicurso com certificado');
      expect(itemMinicurso.tipo).toBe('minicurso');
      expect(itemMinicurso.cargaHorariaMinutos).toBe(360);
      expect(itemMinicurso.codigo).toBe(emitido.body.codigo);

      const itemPalestra = res.body.itens.find((i: any) => i.atividadeId === palestra.id);
      expect(itemPalestra).toBeDefined();
      expect(itemPalestra.titulo).toBe('Palestra sem certificado');
      expect(itemPalestra.tipo).toBe('palestra');
      expect(itemPalestra.cargaHorariaMinutos).toBe(60);
      expect(itemPalestra.codigo).toBeNull();

      expect(res.body.palestrasMinutos).toBe(60);
      expect(res.body.minicursosMinutos).toBe(360);
      expect(res.body.totalMinutos).toBe(420);
      expect(res.body.aproveitadoMinutos).toBe(420);
    });
  });

  describe('G5/R10 — extrato recalculado a cada consulta (sem snapshot)', () => {
    it('R10: a emissão de um certificado entre duas consultas muda codigo de null para o código emitido na MESMA instância e banco', async () => {
      await resetar();

      const minicurso = await criarAtividade({
        titulo: 'Minicurso recalculado',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
          { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' }
        ]
      });

      const ins = await inscrever(minicurso.id, PARTICIPANTE);
      expect(ins.status).toBe(201);
      expect(ins.body.status).toBe('confirmada');

      for (const dia of [19, 20]) {
        await registrarPresenca(dia, minicurso.encontros);
      }

      await definirRelogio('2026-10-24T10:00:00-03:00');

      const primeiroExtrato = await consultarExtrato();
      expect(primeiroExtrato.status).toBe(200);
      const itemAntes = primeiroExtrato.body.itens.find((i: any) => i.atividadeId === minicurso.id);
      expect(itemAntes).toBeDefined();
      expect(itemAntes.codigo).toBeNull();

      const emissao = await request(app)
        .post(`/atividades/${minicurso.id}/certificado`)
        .set('X-Usuario', PARTICIPANTE);
      expect(emissao.status).toBe(201);
      const codigoEmitido = emissao.body.codigo;
      expect(codigoEmitido).toMatch(/^SA26-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/);

      const segundoExtrato = await consultarExtrato();
      expect(segundoExtrato.status).toBe(200);
      const itemDepois = segundoExtrato.body.itens.find((i: any) => i.atividadeId === minicurso.id);
      expect(itemDepois).toBeDefined();
      expect(itemDepois.codigo).toBe(codigoEmitido);
      expect(itemDepois.codigo).not.toBeNull();
    });
  });

  describe('R14 — inscrição em_espera não elegível', () => {
    it('R14: atividade com inscrição em_espera não aparece no extrato', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra com lista de espera',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      const insDiego = await inscrever(palestra.id, OUTRO_PARTICIPANTE);
      expect(insDiego.status).toBe(201);
      expect(insDiego.body.status).toBe('confirmada');

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('em_espera');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens.some((i: any) => i.atividadeId === palestra.id)).toBe(false);
      expect(res.body.itens.length).toBe(0);
    });
  });

  describe('R15 — inscrição convocada não elegível', () => {
    it('R15: atividade com inscrição convocada não aparece no extrato', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra com convocação',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      await inscrever(palestra.id, OUTRO_PARTICIPANTE);

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('em_espera');

      const inscricoes = await request(app)
        .get(`/inscricoes?atividadeId=${palestra.id}`)
        .set('X-Usuario', ORGANIZACAO);
      const insDiego = inscricoes.body.find((i: any) => i.participanteId === OUTRO_PARTICIPANTE);

      await request(app)
        .post(`/inscricoes/${insDiego.id}/cancelamento`)
        .set('X-Usuario', OUTRO_PARTICIPANTE);

      const minhas = await request(app).get('/inscricoes').set('X-Usuario', PARTICIPANTE);
      const minha = minhas.body.find((i: any) => i.atividadeId === palestra.id);
      expect(minha.status).toBe('convocada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens.some((i: any) => i.atividadeId === palestra.id)).toBe(false);
      expect(res.body.itens.length).toBe(0);
    });
  });

  describe('R16 — inscrição cancelada não elegível', () => {
    it('R16: atividade com inscrição cancelada não aparece no extrato', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra com inscrição cancelada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 2,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('confirmada');

      const cancelada = await request(app)
        .post(`/inscricoes/${insCarla.body.id}/cancelamento`)
        .set('X-Usuario', PARTICIPANTE);
      expect(cancelada.status).toBe(200);
      expect(cancelada.body.status).toBe('cancelada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens.some((i: any) => i.atividadeId === palestra.id)).toBe(false);
      expect(res.body.itens.length).toBe(0);
    });
  });

  describe('R17 — inscrição expirada não elegível', () => {
    it('R17: atividade com inscrição expirada não aparece no extrato', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra com inscrição expirada',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 1,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      await inscrever(palestra.id, OUTRO_PARTICIPANTE);

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('em_espera');

      const inscricoes = await request(app)
        .get(`/inscricoes?atividadeId=${palestra.id}`)
        .set('X-Usuario', ORGANIZACAO);
      const insDiego = inscricoes.body.find((i: any) => i.participanteId === OUTRO_PARTICIPANTE);

      await request(app)
        .post(`/inscricoes/${insDiego.id}/cancelamento`)
        .set('X-Usuario', OUTRO_PARTICIPANTE);

      await definirRelogio('2026-10-13T12:00:00-03:00');
      await request(app).get('/inscricoes').set('X-Usuario', ORGANIZACAO);

      const minhas = await request(app).get('/inscricoes').set('X-Usuario', PARTICIPANTE);
      const minha = minhas.body.find((i: any) => i.atividadeId === palestra.id);
      expect(minha.status).toBe('expirada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens.some((i: any) => i.atividadeId === palestra.id)).toBe(false);
      expect(res.body.itens.length).toBe(0);
    });
  });

  describe('R18 — atividade cancelada não elegível', () => {
    it('R18: atividade cancelada não aparece no extrato, mesmo existindo inscrição relacionada', async () => {
      await resetar();

      const palestra = await criarAtividade({
        titulo: 'Palestra cancelada pela organização',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 2,
        encontros: [
          { inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }
        ]
      });

      const insCarla = await inscrever(palestra.id, PARTICIPANTE);
      expect(insCarla.status).toBe(201);
      expect(insCarla.body.status).toBe('confirmada');

      const cancelamento = await request(app)
        .post(`/atividades/${palestra.id}/cancelamento`)
        .set('X-Usuario', ORGANIZACAO);
      expect(cancelamento.status).toBe(200);

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens.some((i: any) => i.atividadeId === palestra.id)).toBe(false);
      expect(res.body.itens.length).toBe(0);
    });
  });

  describe('R3 — cargas brutas das atividades elegíveis', () => {
    it('R3: palestrasMinutos e minicursosMinutos são as somas brutas das atividades elegíveis, sem teto', async () => {
      await resetar();

      const palestra240 = await criarAtividade({
        titulo: 'Palestra de 240 minutos',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }
        ]
      });

      const palestra60 = await criarAtividade({
        titulo: 'Palestra de 60 minutos',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

      const minicurso500 = await criarAtividade({
        titulo: 'Minicurso de 500 minutos',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T16:00:00-03:00', fim: '2026-10-19T19:00:00-03:00' },
          { inicio: '2026-10-20T16:00:00-03:00', fim: '2026-10-20T19:00:00-03:00' },
          { inicio: '2026-10-21T16:00:00-03:00', fim: '2026-10-21T18:20:00-03:00' }
        ]
      });

      const ins1 = await inscrever(palestra240.id, PARTICIPANTE);
      expect(ins1.body.status).toBe('confirmada');
      const ins2 = await inscrever(palestra60.id, PARTICIPANTE);
      expect(ins2.body.status).toBe('confirmada');
      const ins3 = await inscrever(minicurso500.id, PARTICIPANTE);
      expect(ins3.body.status).toBe('confirmada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.palestrasMinutos).toBe(300);
      expect(res.body.minicursosMinutos).toBe(500);
      expect(res.body.totalMinutos).toBe(800);
      expect(res.body.aproveitadoMinutos).toBe(740);
      expect(res.body.itens.length).toBe(3);
    });
  });

  describe('R4 — teto de aproveitamento das palestras (240 min)', () => {
    it('R4: palestras acima de 240 minutos permanecem brutas em palestrasMinutos e aplicam o teto de 240 só em aproveitadoMinutos', async () => {
      await resetar();

      const palestra240 = await criarAtividade({
        titulo: 'Palestra de 240 minutos',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T12:00:00-03:00' }
        ]
      });

      const palestra60 = await criarAtividade({
        titulo: 'Palestra de 60 minutos',
        tipo: 'palestra',
        salaId: 'sala-102',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T14:00:00-03:00', fim: '2026-10-19T15:00:00-03:00' }
        ]
      });

      const ins1 = await inscrever(palestra240.id, PARTICIPANTE);
      expect(ins1.body.status).toBe('confirmada');
      const ins2 = await inscrever(palestra60.id, PARTICIPANTE);
      expect(ins2.body.status).toBe('confirmada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.palestrasMinutos).toBe(300);
      expect(res.body.minicursosMinutos).toBe(0);
      expect(res.body.totalMinutos).toBe(300);
      expect(res.body.aproveitadoMinutos).toBe(240);
    });
  });

  describe('R5 — teto total de aproveitamento (1200 min)', () => {
    it('R5: aproveitadoMinutos aplica o teto de 1200 depois do teto de palestras, preservando os brutos', async () => {
      await resetar();

      const palestra120 = await criarAtividade({
        titulo: 'Palestra de 120 minutos',
        tipo: 'palestra',
        salaId: 'sala-101',
        vagas: 30,
        encontros: [
          { inicio: '2026-10-19T08:00:00-03:00', fim: '2026-10-19T10:00:00-03:00' }
        ]
      });

      const minicurso700 = await criarAtividade({
        titulo: 'Minicurso de 700 minutos',
        tipo: 'minicurso',
        salaId: 'sala-102',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-19T11:00:00-03:00', fim: '2026-10-19T13:20:00-03:00' },
          { inicio: '2026-10-20T11:00:00-03:00', fim: '2026-10-20T13:20:00-03:00' },
          { inicio: '2026-10-21T11:00:00-03:00', fim: '2026-10-21T13:20:00-03:00' },
          { inicio: '2026-10-22T11:00:00-03:00', fim: '2026-10-22T13:20:00-03:00' },
          { inicio: '2026-10-23T11:00:00-03:00', fim: '2026-10-23T13:20:00-03:00' }
        ]
      });

      const minicurso600 = await criarAtividade({
        titulo: 'Minicurso de 600 minutos',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: [
          { inicio: '2026-10-20T15:00:00-03:00', fim: '2026-10-20T17:30:00-03:00' },
          { inicio: '2026-10-21T15:00:00-03:00', fim: '2026-10-21T17:30:00-03:00' },
          { inicio: '2026-10-22T15:00:00-03:00', fim: '2026-10-22T17:30:00-03:00' },
          { inicio: '2026-10-23T15:00:00-03:00', fim: '2026-10-23T17:30:00-03:00' }
        ]
      });

      const ins1 = await inscrever(palestra120.id, PARTICIPANTE);
      expect(ins1.body.status).toBe('confirmada');
      const ins2 = await inscrever(minicurso700.id, PARTICIPANTE);
      expect(ins2.body.status).toBe('confirmada');
      const ins3 = await inscrever(minicurso600.id, PARTICIPANTE);
      expect(ins3.body.status).toBe('confirmada');

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.palestrasMinutos).toBe(120);
      expect(res.body.minicursosMinutos).toBe(1300);
      expect(res.body.totalMinutos).toBe(1420);
      expect(res.body.aproveitadoMinutos).toBe(1200);
    });
  });

  describe('participante sem atividades elegíveis', () => {
    it('devolve itens vazio e totais coerentes com zero', async () => {
      await resetar();

      const res = await consultarExtrato();
      expect(res.status).toBe(200);
      expect(res.body.itens).toEqual([]);
      expect(res.body.palestrasMinutos).toBe(0);
      expect(res.body.minicursosMinutos).toBe(0);
      expect(res.body.totalMinutos).toBe(0);
      expect(res.body.aproveitadoMinutos).toBe(0);
    });
  });
});