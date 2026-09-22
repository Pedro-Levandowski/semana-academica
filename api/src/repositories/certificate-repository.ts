import Database from 'better-sqlite3';

export function ehColisaoDeCodigoUnica(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') {
    return false;
  }
  const code = (erro as { code?: unknown }).code;
  return code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export interface CertificadoRow {
  codigo: string;
  atividadeId: string;
  participanteId: string;
  cargaHorariaMinutos: number;
  presencas: number;
  encontros: number;
  emitidoEm: string;
}

export class CertificateRepository {
  constructor(private db: Database.Database) {}

  create(certificado: CertificadoRow): void {
    this.db.prepare(`
      INSERT INTO certificados (
        codigo, atividade_id, participante_id, carga_horaria_minutos, presencas, encontros, emitido_em
      ) VALUES (
        @codigo, @atividadeId, @participanteId, @cargaHorariaMinutos, @presencas, @encontros, @emitidoEm
      )
    `).run(certificado);
  }

  findByCodigo(codigo: string): CertificadoRow | undefined {
    const row = this.db.prepare(`
      SELECT codigo, atividade_id, participante_id, carga_horaria_minutos, presencas, encontros, emitido_em
      FROM certificados
      WHERE codigo = ?
    `).get(codigo) as
      | {
          codigo: string;
          atividade_id: string;
          participante_id: string;
          carga_horaria_minutos: number;
          presencas: number;
          encontros: number;
          emitido_em: string;
        }
      | undefined;

    if (!row) {
      return undefined;
    }

    return {
      codigo: row.codigo,
      atividadeId: row.atividade_id,
      participanteId: row.participante_id,
      cargaHorariaMinutos: row.carga_horaria_minutos,
      presencas: row.presencas,
      encontros: row.encontros,
      emitidoEm: row.emitido_em
    };
  }

  findByParticipante(participanteId: string): CertificadoRow[] {
    const rows = this.db.prepare(`
      SELECT codigo, atividade_id, participante_id, carga_horaria_minutos, presencas, encontros, emitido_em
      FROM certificados
      WHERE participante_id = ?
    `).all(participanteId) as Array<{
      codigo: string;
      atividade_id: string;
      participante_id: string;
      carga_horaria_minutos: number;
      presencas: number;
      encontros: number;
      emitido_em: string;
    }>;

    return rows.map((row) => ({
      codigo: row.codigo,
      atividadeId: row.atividade_id,
      participanteId: row.participante_id,
      cargaHorariaMinutos: row.carga_horaria_minutos,
      presencas: row.presencas,
      encontros: row.encontros,
      emitidoEm: row.emitido_em
    }));
  }

  findByAtividadeEParticipante(atividadeId: string, participanteId: string): CertificadoRow | undefined {
    const row = this.db.prepare(`
      SELECT codigo, atividade_id, participante_id, carga_horaria_minutos, presencas, encontros, emitido_em
      FROM certificados
      WHERE atividade_id = ? AND participante_id = ?
    `).get(atividadeId, participanteId) as
      | {
          codigo: string;
          atividade_id: string;
          participante_id: string;
          carga_horaria_minutos: number;
          presencas: number;
          encontros: number;
          emitido_em: string;
        }
      | undefined;

    if (!row) {
      return undefined;
    }

    return {
      codigo: row.codigo,
      atividadeId: row.atividade_id,
      participanteId: row.participante_id,
      cargaHorariaMinutos: row.carga_horaria_minutos,
      presencas: row.presencas,
      encontros: row.encontros,
      emitidoEm: row.emitido_em
    };
  }
}