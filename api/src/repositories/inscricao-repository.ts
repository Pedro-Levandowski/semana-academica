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

  countConfirmed(atividadeId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM inscricoes
      WHERE atividadeId = ? AND status = 'confirmada'
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

  countOccupiedMinicursos(participanteId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(DISTINCT i.atividadeId) as count
      FROM inscricoes i
      JOIN atividades a ON a.id = i.atividadeId
      WHERE i.participanteId = ?
        AND i.status IN ('confirmada', 'convocada')
        AND a.tipo = 'minicurso'
        AND a.cancelada = 0
    `).get(participanteId) as { count: number };
    return row.count;
  }

  getOccupiedEncountersForParticipant(participanteId: string): Array<{ atividadeId: string; inicio: string; fim: string }> {
    return this.db.prepare(`
      SELECT i.atividadeId, e.inicio, e.fim
      FROM inscricoes i
      JOIN encontros e ON e.atividade_id = i.atividadeId
      JOIN atividades a ON a.id = i.atividadeId
      WHERE i.participanteId = ?
        AND i.status IN ('confirmada', 'convocada')
        AND a.cancelada = 0
    `).all(participanteId) as Array<{ atividadeId: string; inicio: string; fim: string }>;
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

  getEndedActivitiesForParticipant(participanteId: string): Array<{ atividadeId: string; maxFim: string }> {
    return this.db.prepare(`
      SELECT i.atividadeId, MAX(e.fim) as maxFim
      FROM inscricoes i
      JOIN encontros e ON e.atividade_id = i.atividadeId
      JOIN atividades a ON a.id = i.atividadeId
      WHERE i.participanteId = ?
        AND i.status IN ('confirmada', 'convocada')
        AND a.cancelada = 0
      GROUP BY i.atividadeId
    `).all(participanteId) as Array<{ atividadeId: string; maxFim: string }>;
  }

  hasPresencaInActivity(atividadeId: string, participanteId: string): boolean {
    const row = this.db.prepare(`
      SELECT p.id
      FROM presencas p
      JOIN encontros e ON e.id = p.encontroId
      WHERE e.atividade_id = ? AND p.participanteId = ?
      LIMIT 1
    `).get(atividadeId, participanteId);
    return !!row;
  }

  findConvocadas(atividadeId?: string): InscricaoData[] {
    if (atividadeId) {
      return this.db.prepare(`
        SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
        FROM inscricoes
        WHERE atividadeId = ? AND status = 'convocada'
      `).all(atividadeId) as InscricaoData[];
    }
    return this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      WHERE status = 'convocada'
    `).all() as InscricaoData[];
  }

  findFirstInWaitlist(atividadeId: string): InscricaoData | null {
    const row = this.db.prepare(`
      SELECT id, atividadeId, participanteId, status, posicaoNaEspera, convocadaAte, criadaEm
      FROM inscricoes
      WHERE atividadeId = ? AND status = 'em_espera'
      ORDER BY criadaEm ASC
      LIMIT 1
    `).get(atividadeId) as InscricaoData | undefined;
    return row || null;
  }

  expireInscricao(id: string): void {
    this.db.prepare(`
      UPDATE inscricoes
      SET status = 'expirada', convocadaAte = NULL, posicaoNaEspera = NULL
      WHERE id = ?
    `).run(id);
  }

  promoteToConvocada(id: string, convocadaAte: string): void {
    this.db.prepare(`
      UPDATE inscricoes
      SET status = 'convocada', posicaoNaEspera = NULL, convocadaAte = ?
      WHERE id = ?
    `).run(convocadaAte, id);
  }

  confirmInscricao(id: string): void {
    this.db.prepare(`
      UPDATE inscricoes
      SET status = 'confirmada', convocadaAte = NULL, posicaoNaEspera = NULL
      WHERE id = ?
    `).run(id);
  }

  reorderWaitlist(atividadeId: string): void {
    const waitlist = this.db.prepare(`
      SELECT id FROM inscricoes
      WHERE atividadeId = ? AND status = 'em_espera'
      ORDER BY criadaEm ASC
    `).all(atividadeId) as Array<{ id: string }>;

    const updateStmt = this.db.prepare(`
      UPDATE inscricoes SET posicaoNaEspera = ? WHERE id = ?
    `);

    for (let i = 0; i < waitlist.length; i++) {
      updateStmt.run(i + 1, waitlist[i].id);
    }
  }

  findDistinctActivityIdsWithInscricoes(): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT atividadeId FROM inscricoes
    `).all() as Array<{ atividadeId: string }>;
    return rows.map(r => r.atividadeId);
  }
}
