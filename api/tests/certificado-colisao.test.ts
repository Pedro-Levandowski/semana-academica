import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import { ControllableClock } from '../src/test-support/controllable-clock.js';
import { CertificateRepository } from '../src/repositories/certificate-repository.js';
import { EmitirCertificado, ActivitySnapshot, EmissaoResult } from '../src/certificate/emissao-certificado.js';
import { M3PresencePort } from '../src/integrations/m3-presence-port.js';
import { M2IntegrationPort, InscricaoDoParticipante } from '../src/integrations/m2-port.js';

class PresencaSuficiente implements M3PresencePort {
  countPresencas(): number {
    return 4;
  }
}

class InscricaoConfirmada implements M2IntegrationPort {
  getOcupadas(_atividadeId: string): number {
    return 0;
  }

  getEmEspera(_atividadeId: string): number {
    return 0;
  }

  convocarEspera(_atividadeId: string): void {
    // no-op
  }

  cancelarInscricoes(_atividadeId: string): void {
    // no-op
  }

  listarInscricoesDoParticipante(_participanteId: string): InscricaoDoParticipante[] {
    return [{ atividadeId: ATIVIDADE_B_ID, status: 'confirmada' }];
  }
}

class GeradorDeCodigoDeterministico {
  chamadas = 0;

  constructor(private fila: readonly string[]) {}

  gerar(): string {
    this.chamadas += 1;
    const codigo = this.fila[this.chamadas - 1];
    if (codigo === undefined) {
      throw new Error('Fila de codigos do gerador esgotada');
    }
    return codigo;
  }
}

const CODIGO_A = 'SA26-AAAA-AAAA';
const CODIGO_B = 'SA26-BBBB-BBBB';
const PARTICIPANTE_A_ID = 'p-diego';
const PARTICIPANTE_B_ID = 'p-carla';
const ATIVIDADE_A_ID = 'atv-colisao-a';
const ATIVIDADE_B_ID = 'atv-colisao-b';
const RELOGIO_APOS_TERMINO = '2026-10-24T10:00:00-03:00';

const SNAPSHOT_ATIVIDADE_B: ActivitySnapshot = {
  id: ATIVIDADE_B_ID,
  cargaHorariaMinutos: 240,
  encontros: [
    { inicio: '2026-10-19T19:00:00-03:00', fim: '2026-10-19T22:00:00-03:00' },
    { inicio: '2026-10-20T19:00:00-03:00', fim: '2026-10-20T22:00:00-03:00' },
    { inicio: '2026-10-21T19:00:00-03:00', fim: '2026-10-21T22:00:00-03:00' },
    { inicio: '2026-10-22T19:00:00-03:00', fim: '2026-10-22T22:00:00-03:00' }
  ]
};

function montarCenario() {
  const db = createDatabase();
  runMigrations(db);
  runSeed(db);

  db.prepare(`
    INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, cancelada)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ATIVIDADE_A_ID, 'Palestra de abertura', 'palestra', 'auditorio', 200, 120, 0);
  db.prepare(`
    INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, cancelada)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ATIVIDADE_B_ID, 'Minicurso de dados', 'minicurso', 'lab-3', 20, 240, 0);

  db.prepare(`
    INSERT INTO certificados (codigo, atividade_id, participante_id, carga_horaria_minutos, presencas, encontros, emitido_em)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(CODIGO_A, ATIVIDADE_A_ID, PARTICIPANTE_A_ID, 120, 4, 4, RELOGIO_APOS_TERMINO);

  const clock = new ControllableClock(RELOGIO_APOS_TERMINO);
  const repository = new CertificateRepository(db);
  const gerador = new GeradorDeCodigoDeterministico([CODIGO_A, CODIGO_B]);
  const emitir = new EmitirCertificado(
    clock,
    new PresencaSuficiente(),
    repository,
    new InscricaoConfirmada(),
    () => gerador.gerar()
  );

  return { db, emitir, gerador, repository };
}

describe('M4 - Certificados - R6 (unicidade do código do certificado)', () => {
  let db: Database.Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  it('recupera a colisão de código: ao gerar código já ocupado, a emissão do participante B tenta novamente e persiste com novo código', () => {
    const cenario = montarCenario();
    db = cenario.db;

    let erroAoEmitir: unknown;
    let emissaoB: EmissaoResult | undefined;
    try {
      emissaoB = cenario.emitir.execute(SNAPSHOT_ATIVIDADE_B, PARTICIPANTE_B_ID);
    } catch (erro) {
      erroAoEmitir = erro;
    }

    expect({
      erroAoEmitir,
      chamadasAoGerador: cenario.gerador.chamadas,
      codigoDaEmissaoB: emissaoB?.ok ? emissaoB.certificado.codigo : undefined
    }).toEqual({
      erroAoEmitir: undefined,
      chamadasAoGerador: 2,
      codigoDaEmissaoB: CODIGO_B
    });

    if (emissaoB?.ok) {
      expect(emissaoB.certificado.codigo).not.toBe(CODIGO_A);
    }

    expect(cenario.repository.findByCodigo(CODIGO_A)).toBeDefined();
    expect(cenario.repository.findByCodigo(CODIGO_B)).toBeDefined();

    const total = cenario.db.prepare('SELECT COUNT(*) AS total FROM certificados').get() as { total: number };
    expect(total.total).toBe(2);
  });
});