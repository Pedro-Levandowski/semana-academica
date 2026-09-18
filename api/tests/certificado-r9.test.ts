import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { runSeed } from '../src/db/seed.js';
import { ControllableClock } from '../src/test-support/controllable-clock.js';
import { CertificateRepository } from '../src/repositories/certificate-repository.js';
import { EmitirCertificado, ActivitySnapshot } from '../src/certificate/emissao-certificado.js';
import { M3PresencePort } from '../src/integrations/m3-presence-port.js';

class PresencaSuficiente implements M3PresencePort {
  countPresencas(): number {
    return 4;
  }
}

const PARTICIPANTE = 'p-carla';
const ATIVIDADE_ID = 'atv-r9';
const RELOGIO_APOS_TERMINO = '2026-10-24T10:00:00-03:00';

const SNAPSHOT_ATIVIDADE: ActivitySnapshot = {
  id: ATIVIDADE_ID,
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
  `).run(ATIVIDADE_ID, 'Minicurso R9', 'minicurso', 'lab-3', 10, 240, 0);

  const clock = new ControllableClock(RELOGIO_APOS_TERMINO);
  const repository = new CertificateRepository(db);
  const emitir = new EmitirCertificado(clock, new PresencaSuficiente(), repository);

  return { db, emitir };
}

describe('M4 - Certificados - R9 (Idempotência da emissão)', () => {
  let db: Database.Database | undefined;

  afterEach(() => {
    db?.close();
    db = undefined;
  });

  it('reutiliza o certificado existente na segunda emissão para a mesma atividade e participante, preservando o código', () => {
    const cenario = montarCenario();
    db = cenario.db;

    const primeira = cenario.emitir.execute(SNAPSHOT_ATIVIDADE, PARTICIPANTE);
    expect(primeira.ok).toBe(true);
    if (!primeira.ok) return;

    const segunda = cenario.emitir.execute(SNAPSHOT_ATIVIDADE, PARTICIPANTE);
    expect(segunda.ok).toBe(true);
    if (!segunda.ok) return;

    expect(segunda.certificado.codigo).toBe(primeira.certificado.codigo);
    expect(segunda.certificado.emitidoEm).toBe(primeira.certificado.emitidoEm);
    expect(segunda.certificado.presencas).toBe(primeira.certificado.presencas);
    expect(segunda.certificado.encontros).toBe(primeira.certificado.encontros);

    const linhas = cenario.db.prepare(`
      SELECT COUNT(*) AS total FROM certificados WHERE atividade_id = ? AND participante_id = ?
    `).get(ATIVIDADE_ID, PARTICIPANTE) as { total: number };
    expect(linhas.total).toBe(1);
  });
});