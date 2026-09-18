import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';

function encontrosDoMinicurso(dias: number[]) {
  return dias.map((dia) => ({
    inicio: `2026-10-${dia}T19:00:00-03:00`,
    fim: `2026-10-${dia}T22:00:00-03:00`
  }));
}

function encontrarEncontro(encontros: Array<{ id: string; inicio: string }>, dia: number) {
  return encontros.find((enc) => enc.inicio.startsWith(`2026-10-${dia}T`));
}

describe('M4 - Certificados - Fatia 1 (R1 e R2)', () => {
  let app: any;

  beforeEach(() => {
    app = createApp({ modoTeste: true });
  });

  afterEach(() => {
    app?.close?.();
  });

  async function definirRelogio(agora: string) {
    const res = await request(app).put('/_teste/relogio').send({ agora });
    expect(res.status).toBe(200);
  }

  async function montarCenario(dias: number[], diasComPresenca: number[], relogioFinal: string) {
    const resReset = await request(app).post('/_teste/reset');
    expect(resReset.status).toBe(204);

    const criacao = await request(app)
      .post('/atividades')
      .set('X-Usuario', ORGANIZACAO)
      .send({
        titulo: 'Minicurso para emissão',
        tipo: 'minicurso',
        salaId: 'lab-3',
        vagas: 10,
        encontros: encontrosDoMinicurso(dias)
      });
    const atividadeId = criacao.body?.id;
    const encontros: Array<{ id: string; inicio: string }> = criacao.body?.encontros ?? [];

    await request(app)
      .post(`/atividades/${atividadeId}/inscricoes`)
      .set('X-Usuario', PARTICIPANTE);

    for (const dia of diasComPresenca) {
      const encontro = encontrarEncontro(encontros, dia);
      if (!encontro) continue;
      await request(app).put('/_teste/relogio').send({ agora: `2026-10-${dia}T19:30:00-03:00` });
      const codigoRes = await request(app)
        .get(`/encontros/${encontro.id}/codigo`)
        .set('X-Usuario', ORGANIZACAO);
      const codigo = codigoRes.body?.codigo ?? '';
      await request(app)
        .post(`/encontros/${encontro.id}/presencas`)
        .set('X-Usuario', PARTICIPANTE)
        .send({ codigo });
    }

    await definirRelogio(relogioFinal);

    return { atividadeId, totalEncontros: encontros.length };
  }

  function solicitarCertificado(atividadeId: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);
  }

  describe('R1 - Presença mínima de 75% sem arredondamento a favor', () => {
    it('emite o certificado de atividade encerrada com 4 encontros quando a presença é exatamente 75% (3 de 4)', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21],
        '2026-10-24T10:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(201);
      expect(res.body.presencas).toBe(3);
      expect(res.body.encontros).toBe(4);
      expect(res.body.atividadeId).toBe(atividadeId);
      expect(res.body.participanteId).toBe(PARTICIPANTE);
    });

    it('recusa com 422 PRESENCA_INSUFICIENTE o certificado de atividade encerrada com presença de 50% (2 de 4)', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20],
        '2026-10-24T10:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('PRESENCA_INSUFICIENTE');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('recusa com 422 PRESENCA_INSUFICIENTE presença de 3 em 5 encontros (60%; 75% de 5 é 3,75, sem arredondamento a favor)', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22, 23],
        [19, 20, 21],
        '2026-10-24T10:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('PRESENCA_INSUFICIENTE');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('emite o certificado de atividade encerrada com 5 encontros quando a presença é 80% (4 de 5)', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22, 23],
        [19, 20, 21, 22],
        '2026-10-24T10:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(201);
      expect(res.body.presencas).toBe(4);
      expect(res.body.encontros).toBe(5);
      expect(res.body.atividadeId).toBe(atividadeId);
      expect(res.body.participanteId).toBe(PARTICIPANTE);
    });
  });

  describe('R2 - Emissão somente após o encerramento da atividade', () => {
    it('recusa com 422 ATIVIDADE_NAO_ENCERRADA antes do término do último encontro, mesmo com presença suficiente', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-22T21:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe('ATIVIDADE_NAO_ENCERRADA');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('emite o certificado no instante exato do término do último encontro', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-22T22:00:00-03:00'
      );

      const res = await solicitarCertificado(atividadeId);

      expect(res.status).toBe(201);
      expect(res.body.presencas).toBe(4);
      expect(res.body.encontros).toBe(4);
      expect(res.body.atividadeId).toBe(atividadeId);
      expect(res.body.participanteId).toBe(PARTICIPANTE);
    });
  });
});