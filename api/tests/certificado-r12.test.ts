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

describe('M4 - Certificados - Fatia 1 (R12 - Precedência de erros na emissão)', () => {
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
        titulo: 'Minicurso para precedência',
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

  it('R12 (Critério 20): atividade não encerrada com 2 de 4 presenças retorna 422 ATIVIDADE_NAO_ENCERRADA e não PRESENCA_INSUFICIENTE', async () => {
    const { atividadeId } = await montarCenario(
      [19, 20, 21, 22],
      [19, 20],
      '2026-10-22T21:00:00-03:00'
    );

    const res = await request(app)
      .post(`/atividades/${atividadeId}/certificado`)
      .set('X-Usuario', PARTICIPANTE);

    expect(res.status).toBe(422);
    expect(res.body.erro).toBe('ATIVIDADE_NAO_ENCERRADA');
    expect(res.body.erro).not.toBe('PRESENCA_INSUFICIENTE');
    expect(typeof res.body.mensagem).toBe('string');
  });
});