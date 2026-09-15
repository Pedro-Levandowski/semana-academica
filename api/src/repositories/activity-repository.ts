import Database from 'better-sqlite3';

export interface ActivityRow {
  id: string;
  titulo: string;
  tipo: string;
  salaId: string;
  vagas: number;
  cargaHorariaMinutos: number;
  cancelada: number;
}

export interface EncounterRow {
  id: string;
  inicio: string;
  fim: string;
}

export class ActivityRepository {
  constructor(private db: Database.Database) {}

  findAll(): Array<ActivityRow & { encontros: EncounterRow[] }> {
    const atividades = this.db.prepare(`
      SELECT id, titulo, tipo, sala_id as salaId, vagas, carga_horaria_minutos as cargaHorariaMinutos, cancelada 
      FROM atividades
    `).all() as ActivityRow[];

    return atividades.map(atv => ({
      ...atv,
      encontros: this.db.prepare(`
        SELECT id, inicio, fim 
        FROM encontros 
        WHERE atividade_id = ?
      `).all(atv.id) as EncounterRow[]
    }));
  }
}
