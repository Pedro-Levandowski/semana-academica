import Database from 'better-sqlite3';

export class DesbloqueioRepository {
  constructor(private db: Database.Database) {}

  findLastByParticipant(participanteId: string): string | null {
    const row = this.db.prepare('SELECT desbloqueadoEm FROM m5_desbloqueios WHERE participanteId = ?').get(participanteId) as { desbloqueadoEm: string } | undefined;
    return row ? row.desbloqueadoEm : null;
  }

  upsert(participanteId: string, desbloqueadoEm: string): void {
    this.db.prepare(`
      INSERT INTO m5_desbloqueios (participanteId, desbloqueadoEm)
      VALUES (?, ?)
      ON CONFLICT(participanteId) DO UPDATE SET desbloqueadoEm = excluded.desbloqueadoEm
    `).run(participanteId, desbloqueadoEm);
  }
}
