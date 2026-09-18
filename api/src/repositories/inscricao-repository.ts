import Database from 'better-sqlite3';

export class InscricaoRepository {
  constructor(private db: Database.Database) {}

  findStatus(atividadeId: string, participanteId: string): string | null {
    const row = this.db.prepare(`
      SELECT status FROM inscricoes
      WHERE atividadeId = ? AND participanteId = ?
    `).get(atividadeId, participanteId) as { status: string } | undefined;

    return row ? row.status : null;
  }
}
