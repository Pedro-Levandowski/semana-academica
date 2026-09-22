import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';

const PARTICIPANTE = 'p-carla';
const ORGANIZACAO = 'org-ana';

describe('M4 - Certificados - persistencia do codigo apos reinicializacao com o mesmo banco', () => {
  it('mantem o mesmo codigo e emitidoEm ao reemitir em nova instancia com o mesmo dbPath, sem reset', async () => {
    const dbPath = path.join(os.tmpdir(), `test-certificado-restart-${Date.now()}-${Math.random()}.sqlite`);
    let app1: any;
    let app2: any;

    try {
      app1 = createApp({ dbPath, modoTeste: true });

      const resReset = await request(app1).post('/_teste/reset');
      expect(resReset.status).toBe(204);

      const criacao = await request(app1)
        .post('/atividades')
        .set('X-Usuario', ORGANIZACAO)
        .send({
          titulo: 'Palestra para restart',
          tipo: 'palestra',
          salaId: 'auditorio',
          vagas: 30,
          encontros: [
            { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' }
          ]
        });
      expect(criacao.status).toBe(201);
      const atividadeId: string = criacao.body?.id;
      const encontroId: string = criacao.body?.encontros?.[0]?.id;

      const inscricao = await request(app1)
        .post(`/atividades/${atividadeId}/inscricoes`)
        .set('X-Usuario', PARTICIPANTE);
      expect(inscricao.status).toBe(201);

      await request(app1).put('/_teste/relogio').send({ agora: '2026-10-19T19:30:00-03:00' });
      const codigoRes = await request(app1)
        .get(`/encontros/${encontroId}/codigo`)
        .set('X-Usuario', ORGANIZACAO);
      const codigo: string = codigoRes.body?.codigo ?? '';
      expect(codigo).not.toBe('');

      const presenca = await request(app1)
        .post(`/encontros/${encontroId}/presencas`)
        .set('X-Usuario', PARTICIPANTE)
        .send({ codigo });
      expect(presenca.status).toBe(201);

      await request(app1).put('/_teste/relogio').send({ agora: '2026-10-19T23:00:00-03:00' });

      const primeira = await request(app1)
        .post(`/atividades/${atividadeId}/certificado`)
        .set('X-Usuario', PARTICIPANTE);
      expect(primeira.status).toBe(201);
      const codigoOriginal: string = primeira.body.codigo;
      const emitidoEmOriginal: string = primeira.body.emitidoEm;
      expect(codigoOriginal).toMatch(/^SA26-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

      app1.close();
      app1 = null;

      app2 = createApp({ dbPath, modoTeste: true });

      const reemissao = await request(app2)
        .post(`/atividades/${atividadeId}/certificado`)
        .set('X-Usuario', PARTICIPANTE);
      expect(reemissao.status).toBe(200);
      expect(reemissao.body.codigo).toBe(codigoOriginal);
      expect(reemissao.body.emitidoEm).toBe(emitidoEmOriginal);
    } finally {
      app2?.close?.();
      app1?.close?.();
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    }
  });
});