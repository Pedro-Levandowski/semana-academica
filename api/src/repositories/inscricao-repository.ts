import Database from 'better-sqlite3';

export interface InscricaoData {
  id: string;
  atividadeId: string;
  participanteId: string;
  status: 'confirmada' | 'em_espera' | 'convocada' | 'cancelada' | 'expirada';
  posicaoNaEspera: number | null;
  convocadaAte: string | null;
  criadaEm: string;
}

export class InscricaoRepository {
  constructor(private db: Database.Database) {}

  findStatus(atividadeId: string, participanteId: string): string | null {
    const row = this.db.prepare(`
      SELECT status FROM inscricoes
      WHERE atividadeId = ? AND participanteId = ?
    `).get(atividadeId, participanteId) as { status: string } | undefined;

    return row ? row.status : null;
  }

  findByActivityAndParticipant(atividadeId: string, participanteId: string): InscricaoData | null {
    const row = this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      WHERE atividadeId = ? AND participanteId = ?
    `).get(atividadeId, participanteId) as InscricaoData | undefined;

    return row || null;
  }

  create(inscricao: InscricaoData): void {
    this.db.prepare(`
      INSERT INTO inscricoes (id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      inscricao.id,
      inscricao.atividadeId,
      inscricao.participanteId,
      inscricao.status,
      inscricao.posicaoNaEspera,
      inscricao.convocadaAte,
      inscricao.criadaEm
    );
  }

  countOccupied(atividadeId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM inscricoes
      WHERE atividadeId = ? AND status IN ('confirmada', 'convocada')
    `).get(atividadeId) as { count: number };
    return row.count;
  }

  countInWaitlist(atividadeId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM inscricoes
      WHERE atividadeId = ? AND status = 'em_espera'
    `).get(atividadeId) as { count: number };
    return row.count;
  }

  findByParticipant(participanteId: string, atividadeId?: string): InscricaoData[] {
    if (atividadeId) {
      return this.db.prepare(`
        SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
        FROM inscricoes
        WHERE participanteId = ? AND atividadeId = ?
        ORDER BY criadaEm ASC
      `).all(participanteId, atividadeId) as InscricaoData[];
    }
    return this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      WHERE participanteId = ?
      ORDER BY criadaEm ASC
    `).all(participanteId) as InscricaoData[];
  }

  findAll(atividadeId?: string): InscricaoData[] {
    if (atividadeId) {
      return this.db.prepare(`
        SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
        FROM inscricoes
        WHERE atividadeId = ?
        ORDER BY criadaEm ASC
      `).all(atividadeId) as InscricaoData[];
    }
    return this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      ORDER BY criadaEm ASC
    `).all() as InscricaoData[];
  }

  findById(id: string): InscricaoData | null {
    const row = this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      WHERE id = ?
    `).get(id) as InscricaoData | undefined;

    return row || null;
  }
}
