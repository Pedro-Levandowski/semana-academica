import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';
const TITULO = 'Minicurso para emissão';

function encontrosDoMinicurso(dias: number[]) {
  return dias.map((dia) => ({
    inicio: `2026-10-${dia}T19:00:00-03:00`,
    fim: `2026-10-${dia}T22:00:00-03:00`
  }));
}

function encontrarEncontro(encontros: Array<{ id: string; inicio: string }>, dia: number) {
  return encontros.find((enc) => enc.inicio.startsWith(`2026-10-${dia}T`));
}

describe('M4 - Certificados - Fatia 3 (R8 - Verificação pública)', () => {
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
        titulo: TITULO,
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

  function emitirCertificado(atividadeId: string) {
    return request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);
  }

  describe('R8 - Critério 15: verificação pública sem X-Usuario', () => {
    it('retorna 200 com exatamente codigo, participante abreviado, atividade, cargaHorariaMinutos e emitidoEm', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-24T10:00:00-03:00'
      );

      const emitido = await emitirCertificado(atividadeId);
      expect(emitido.status).toBe(201);

      const res = await request(app).get(`/certificados/${emitido.body.codigo}`);

      expect(res.status).toBe(200);
      expect(Object.keys(res.body).sort()).toEqual([
        'atividade',
        'cargaHorariaMinutos',
        'codigo',
        'emitidoEm',
        'participante'
      ]);
      expect(res.body.codigo).toBe(emitido.body.codigo);
      expect(res.body.participante).toBe('Carla M. S.');
      expect(res.body.atividade).toBe(TITULO);
      expect(res.body.cargaHorariaMinutos).toBe(720);
      expect(res.body.emitidoEm).toBe(emitido.body.emitidoEm);
    });
  });

  describe('R8 - Critério 16: projeção somente dos campos públicos', () => {
    it('não expõe participanteId, presencas nem encontros na verificação pública', async () => {
      const { atividadeId } = await montarCenario(
        [19, 20, 21, 22],
        [19, 20, 21, 22],
        '2026-10-24T10:00:00-03:00'
      );

      const emitido = await emitirCertificado(atividadeId);
      expect(emitido.status).toBe(201);

      const res = await request(app).get(`/certificados/${emitido.body.codigo}`);

      expect(res.status).toBe(200);
      expect(res.body.participanteId).toBeUndefined();
      expect(res.body.presencas).toBeUndefined();
      expect(res.body.encontros).toBeUndefined();
    });
  });

  describe('R8 - Proteção de inexistente', () => {
    it('retorna 404 NAO_ENCONTRADO para código inexistente', async () => {
      const res = await request(app).get('/certificados/SA26-AAAA-BBBB');

      expect(res.status).toBe(404);
      expect(res.body.erro).toBe('NAO_ENCONTRADO');
      expect(typeof res.body.mensagem).toBe('string');
    });
  });
});