import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '../src/app.js';
import type { M5IntegrationPort } from '../src/integrations/m5-port.js';
import type { PainelQueryPort } from '../src/integrations/painel-query-port.js';

describe('M5 - Painel - Fatia 5 (Integração e Precedência de Bloqueio - R17, R18)', () => {
  it('integra bloqueio vigente do painel e desbloqueio com novas inscrições (R17, R18)', async () => {
    const tmpDir = os.tmpdir();
    const dbPath = path.join(tmpDir, `test-painel-fatia5-r17-integ-${Date.now()}-${Math.random()}.sqlite`);

    const painelQueryPort: PainelQueryPort = {
      listarAtividades: () => [
        {
          id: 'act-passada-1',
          titulo: 'Passada 1',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-p1', inicio: '2026-10-15T08:00:00-03:00', fim: '2026-10-15T10:00:00-03:00', presencas: [] }],
          inscricoes: [{ participanteId: 'p-carla', nome: 'Carla Mendes Souza', status: 'confirmada' as const }]
        },
        {
          id: 'act-passada-2',
          titulo: 'Passada 2',
          vagas: 10,
          cancelada: false,
          encontros: [{ id: 'enc-p2', inicio: '2026-10-16T08:00:00-03:00', fim: '2026-10-16T10:00:00-03:00', presencas: [] }],
          inscricoes: [{ participanteId: 'p-carla', nome: 'Carla Mendes Souza', status: 'confirmada' as const }]
        }
      ]
    };

    const app: any = createApp({ dbPath, modoTeste: true, painelQueryPort });

    try {
      await request(app).post('/_teste/reset');
      await request(app).put('/_teste/relogio').send({ agora: '2026-10-17T11:00:00-03:00' });

      const resBloqueios = await request(app)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resBloqueios.status).toBe(200);
      expect(resBloqueios.body.some((b: any) => b.participanteId === 'p-carla')).toBe(true);

      const atvFuturaRes = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade Futura Teste',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-22T14:00:00-03:00', fim: '2026-10-22T16:00:00-03:00' }
          ]
        });
      expect(atvFuturaRes.status).toBe(201);
      const atvFuturaId = atvFuturaRes.body.id;

      const resInscBloqueada = await request(app)
        .post(`/atividades/${atvFuturaId}/inscricoes`)
        .set('X-Usuario', 'p-carla');

      expect(resInscBloqueada.status).toBe(422);
      expect(resInscBloqueada.body.erro).toBe('INSCRICAO_BLOQUEADA');
      expect(typeof resInscBloqueada.body.mensagem).toBe('string');
      expect(resInscBloqueada.body.mensagem.length).toBeGreaterThan(0);

      const resDelete = await request(app)
        .delete('/painel/bloqueios/p-carla')
        .set('X-Usuario', 'org-ana');
      expect(resDelete.status).toBe(204);

      const resBloqueiosPosDelete = await request(app)
        .get('/painel/bloqueios')
        .set('X-Usuario', 'org-ana');
      expect(resBloqueiosPosDelete.status).toBe(200);
      expect(resBloqueiosPosDelete.body).toEqual([]);

      const resInscLiberada = await request(app)
        .post(`/atividades/${atvFuturaId}/inscricoes`)
        .set('X-Usuario', 'p-carla');

      expect(resInscLiberada.status).toBe(201);
      expect(resInscLiberada.body.participanteId).toBe('p-carla');
      expect(resInscLiberada.body.status).toBe('confirmada');
    } finally {
      app?.close?.();
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch {}
      }
    }
  });

  it('comprova a precedência completa de validações em novas inscrições com porta M5 (R17, R18)', async () => {
    const tmpDir = os.tmpdir();
    const dbPath = path.join(tmpDir, `test-painel-fatia5-r17-prec-${Date.now()}-${Math.random()}.sqlite`);

    let bloqueado = false;
    let chamadasPorta = 0;
    const m5Port: M5IntegrationPort = {
      isParticipantBlocked: (_participanteId: string, _agora: any) => {
        chamadasPorta++;
        return bloqueado;
      }
    };

    const app: any = createApp({ dbPath, modoTeste: true, m5Port });

    try {
      await request(app).post('/_teste/reset');
      await request(app).put('/_teste/relogio').send({ agora: '2026-10-18T08:00:00-03:00' });

      // 1. atividade inexistente:
      bloqueado = true;
      const resInexistente = await request(app)
        .post('/atividades/act-inexistente/inscricoes')
        .set('X-Usuario', 'p-carla');
      expect(resInexistente.status).toBe(404);
      expect(resInexistente.body.erro).toBe('NAO_ENCONTRADO');
      expect(chamadasPorta).toBe(0);

      // 2. atividade cancelada:
      const atvParaCancelarRes = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade Para Cancelar',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }]
        });
      const atvCanceladaId = atvParaCancelarRes.body.id;
      await request(app)
        .post(`/atividades/${atvCanceladaId}/cancelamento`)
        .set('X-Usuario', 'org-ana');

      const chamadasAntesCancelada = chamadasPorta;
      const resCancelada = await request(app)
        .post(`/atividades/${atvCanceladaId}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resCancelada.status).toBe(422);
      expect(resCancelada.body.erro).toBe('ATIVIDADE_CANCELADA');
      expect(chamadasPorta).toBe(chamadasAntesCancelada);

      // 3. inscrições encerradas:
      const atvEncerrarInscRes = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Atividade Prestes A Iniciar',
          tipo: 'palestra',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [{ inicio: '2026-10-20T10:00:00-03:00', fim: '2026-10-20T12:00:00-03:00' }]
        });
      const atvEncerrarInscId = atvEncerrarInscRes.body.id;
      await request(app).put('/_teste/relogio').send({ agora: '2026-10-20T09:31:00-03:00' });

      const chamadasAntesEncerradas = chamadasPorta;
      const resEncerradas = await request(app)
        .post(`/atividades/${atvEncerrarInscId}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resEncerradas.status).toBe(422);
      expect(resEncerradas.body.erro).toBe('INSCRICOES_ENCERRADAS');
      expect(chamadasPorta).toBe(chamadasAntesEncerradas);

      // Retorna relógio para antes do início dos minicursos
      await request(app).put('/_teste/relogio').send({ agora: '2026-10-18T08:00:00-03:00' });

      // 4. bloqueio antes dos erros posteriores:
      bloqueado = false;

      const mc1Res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 1',
          tipo: 'minicurso',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-21T08:00:00-03:00', fim: '2026-10-21T09:00:00-03:00' },
            { inicio: '2026-10-21T09:30:00-03:00', fim: '2026-10-21T10:30:00-03:00' }
          ]
        });
      expect(mc1Res.status).toBe(201);
      const mc1Id = mc1Res.body.id;
      const inscMc1 = await request(app)
        .post(`/atividades/${mc1Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(inscMc1.status).toBe(201);

      const mc2Res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 2',
          tipo: 'minicurso',
          salaId: 'sala-102',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-22T08:00:00-03:00', fim: '2026-10-22T09:00:00-03:00' },
            { inicio: '2026-10-22T09:30:00-03:00', fim: '2026-10-22T10:30:00-03:00' }
          ]
        });
      expect(mc2Res.status).toBe(201);
      const mc2Id = mc2Res.body.id;
      const inscMc2 = await request(app)
        .post(`/atividades/${mc2Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(inscMc2.status).toBe(201);

      const mc3Res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 3',
          tipo: 'minicurso',
          salaId: 'lab-3',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-23T08:00:00-03:00', fim: '2026-10-23T09:00:00-03:00' },
            { inicio: '2026-10-23T09:30:00-03:00', fim: '2026-10-23T10:30:00-03:00' }
          ]
        });
      expect(mc3Res.status).toBe(201);
      const mc3Id = mc3Res.body.id;
      const inscMc3 = await request(app)
        .post(`/atividades/${mc3Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(inscMc3.status).toBe(201);

      const mc4Res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 4 Conflitante',
          tipo: 'minicurso',
          salaId: 'auditorio',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-21T08:30:00-03:00', fim: '2026-10-21T09:30:00-03:00' },
            { inicio: '2026-10-21T10:00:00-03:00', fim: '2026-10-21T11:00:00-03:00' }
          ]
        });
      expect(mc4Res.status).toBe(201);
      const mc4Id = mc4Res.body.id;

      bloqueado = true;
      const chamadasAntesBloqueioPrecedencia = chamadasPorta;

      const resBloqueioPrecedencia = await request(app)
        .post(`/atividades/${mc1Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resBloqueioPrecedencia.status).toBe(422);
      expect(resBloqueioPrecedencia.body.erro).toBe('INSCRICAO_BLOQUEADA');
      expect(chamadasPorta).toBe(chamadasAntesBloqueioPrecedencia + 1);

      // 5. já inscrito:
      bloqueado = false;
      const chamadasAntesJaInscrito = chamadasPorta;
      const resJaInscrito = await request(app)
        .post(`/atividades/${mc1Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resJaInscrito.status).toBe(409);
      expect(resJaInscrito.body.erro).toBe('JA_INSCRITO');
      expect(chamadasPorta).toBe(chamadasAntesJaInscrito + 1);

      // 6. conflito:
      const chamadasAntesConflito = chamadasPorta;
      const resConflito = await request(app)
        .post(`/atividades/${mc4Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resConflito.status).toBe(409);
      expect(resConflito.body.erro).toBe('CONFLITO_DE_HORARIO');
      expect(chamadasPorta).toBe(chamadasAntesConflito + 1);

      // 7. limite:
      const mc5Res = await request(app)
        .post('/atividades')
        .set('X-Usuario', 'org-ana')
        .send({
          titulo: 'Minicurso 5 Nao Conflitante',
          tipo: 'minicurso',
          salaId: 'sala-101',
          vagas: 20,
          encontros: [
            { inicio: '2026-10-20T14:00:00-03:00', fim: '2026-10-20T15:00:00-03:00' },
            { inicio: '2026-10-20T15:30:00-03:00', fim: '2026-10-20T16:30:00-03:00' }
          ]
        });
      expect(mc5Res.status).toBe(201);
      const mc5Id = mc5Res.body.id;

      const chamadasAntesLimite = chamadasPorta;
      const resLimite = await request(app)
        .post(`/atividades/${mc5Id}/inscricoes`)
        .set('X-Usuario', 'p-carla');
      expect(resLimite.status).toBe(422);
      expect(resLimite.body.erro).toBe('LIMITE_DE_MINICURSOS');
      expect(chamadasPorta).toBe(chamadasAntesLimite + 1);
    } finally {
      app?.close?.();
      if (fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch {}
      }
    }
  });
});
