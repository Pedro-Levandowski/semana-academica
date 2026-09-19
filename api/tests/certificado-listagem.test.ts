import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const OUTRO_PARTICIPANTE = 'p-diego';
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

describe('M4 - Certificados - Fatia 2 (GET /certificados)', () => {
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

  async function montarCenario(dias: number[], diasComPresenca: number[], relogioFinal: string, participante = PARTICIPANTE) {
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
      .set('X-Usuario', participante);

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
        .set('X-Usuario', participante)
        .send({ codigo });
    }

    await definirRelogio(relogioFinal);

    return { atividadeId, totalEncontros: encontros.length };
  }

  function emitirCertificado(atividadeId: string, participante = PARTICIPANTE) {
    return request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', participante);
  }

  describe('listagem dos próprios certificados (contrato: GET /certificados → 200 [Certificado])', () => {
    it('retorna 200 com array contendo o certificado emitido com os campos do contrato', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-24T10:00:00-03:00'
      );

      const emitido = await emitirCertificado(atividadeId);
      expect(emitido.status).toBe(201);

      const res = await request(app).get('/certificados').set('X-Usuario', PARTICIPANTE);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const meu = res.body.find((c: any) => c.atividadeId === atividadeId);
      expect(meu).toBeDefined();
      expect(meu.codigo).toBe(emitido.body.codigo);
      expect(meu.atividadeId).toBe(atividadeId);
      expect(meu.participanteId).toBe(PARTICIPANTE);
      expect(meu.cargaHorariaMinutos).toBe(720);
      expect(meu.presencas).toBe(4);
      expect(meu.encontros).toBe(4);
      expect(meu.emitidoEm).toBe(emitido.body.emitidoEm);
    });

    it('retorna 200 com array vazio quando o participante não possui certificados', async () => {
      await request(app).post('/_teste/reset');

      const res = await request(app).get('/certificados').set('X-Usuario', PARTICIPANTE);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('restrição de acesso (contrato: identifica via X-Usuario, somente participante)', () => {
    it('retorna 401 USUARIO_DESCONHECIDO sem o cabeçalho X-Usuario', async () => {
      const res = await request(app).get('/certificados');

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('USUARIO_DESCONHECIDO');
      expect(typeof res.body.mensagem).toBe('string');
    });

    it('retorna 403 SOMENTE_PARTICIPANTE para usuário organização', async () => {
      const res = await request(app).get('/certificados').set('X-Usuario', ORGANIZACAO);

      expect(res.status).toBe(403);
      expect(res.body.erro).toBe('SOMENTE_PARTICIPANTE');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });

  describe('isolamento por participante', () => {
    it('não lista certificado emitido para outro participante', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-24T10:00:00-03:00',
        OUTRO_PARTICIPANTE
      );

      const emitidoDiego = await emitirCertificado(atividadeId, OUTRO_PARTICIPANTE);
      expect(emitidoDiego.status).toBe(201);

      const res = await request(app).get('/certificados').set('X-Usuario', PARTICIPANTE);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.codigo === emitidoDiego.body.codigo)).toBe(false);
    });
  });
});