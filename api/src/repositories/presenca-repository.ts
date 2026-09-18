import Database from 'better-sqlite3';

export interface PresencaRow {
  id: string;
  encontroId: string;
  participanteId: string;
  origem: string;
  lidoEm: string;
  registradaEm: string;
  justificativa: string | null;
}

export class PresencaRepository {
  constructor(private db: Database.Database) {}

  findByEncontro(encontroId: string): PresencaRow[] {
    return this.db.prepare(`
      SELECT id, encontroId, participanteId, origem, lidoEm, registradaEm, justificativa
      FROM presencas
      WHERE encontroId = ?
    `).all(encontroId) as PresencaRow[];
  }

  findByEncontroAndParticipante(encontroId: string, participanteId: string): PresencaRow | null {
    const row = this.db.prepare(`
      SELECT id, encontroId, participanteId, origem, lidoEm, registradaEm, justificativa
      FROM presencas
      WHERE encontroId = ? AND participanteId = ?
    `).get(encontroId, participanteId) as PresencaRow | undefined;

    return row || null;
  }

  create(presenca: PresencaRow): void {
    this.db.prepare(`
      INSERT INTO presencas (id, encontroId, participanteId, origem, lidoEm, registradaEm, justificativa)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      presenca.id,
      presenca.encontroId,
      presenca.participanteId,
      presenca.origem,
      presenca.lidoEm,
      presenca.registradaEm,
      presenca.justificativa
    );
  }

  countManualByEncontro(encontroId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM presencas
      WHERE encontroId = ? AND origem = 'manual'
    `).get(encontroId) as { count: number };
    return row.count;
  }
}
