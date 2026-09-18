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

  findById(id: string): (ActivityRow & { encontros: EncounterRow[] }) | null {
    const atv = this.db.prepare(`
      SELECT id, titulo, tipo, sala_id as salaId, vagas, carga_horaria_minutos as cargaHorariaMinutos, cancelada
      FROM atividades
      WHERE id = ?
    `).get(id) as ActivityRow | undefined;

    if (!atv) {
      return null;
    }

    const encontros = this.db.prepare(`
      SELECT id, inicio, fim
      FROM encontros
      WHERE atividade_id = ?
    `).all(atv.id) as EncounterRow[];

    return {
      ...atv,
      encontros
    };
  }

  create(activity: {
    id: string;
    titulo: string;
    tipo: string;
    salaId: string;
    vagas: number;
    cargaHorariaMinutos: number;
    encontros: Array<{ id: string; inicio: string; fim: string }>;
  }): void {
    const insertActivity = this.db.prepare(`
      INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, cancelada)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    const insertEncounter = this.db.prepare(`
      INSERT INTO encontros (id, atividade_id, inicio, fim)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertActivity.run(
        activity.id,
        activity.titulo,
        activity.tipo,
        activity.salaId,
        activity.vagas,
        activity.cargaHorariaMinutos
      );
      for (const enc of activity.encontros) {
        insertEncounter.run(enc.id, activity.id, enc.inicio, enc.fim);
      }
    });

    transaction();
  }

  findActiveEncountersByRoomId(salaId: string): Array<{ inicio: string; fim: string }> {
    return this.db.prepare(`
      SELECT e.inicio, e.fim
      FROM encontros e
      JOIN atividades a ON e.atividade_id = a.id
      WHERE a.sala_id = ? AND a.cancelada = 0
    `).all(salaId) as Array<{ inicio: string; fim: string }>;
  }

  findEncounterWithActivity(encontroId: string): {
    encounter: EncounterRow;
    activity: ActivityRow;
  } | null {
    const row = this.db.prepare(`
      SELECT 
        e.id as enc_id, e.inicio as enc_inicio, e.fim as enc_fim,
        a.id as atv_id, a.titulo as atv_titulo, a.tipo as atv_tipo, a.sala_id as atv_salaId, 
        a.vagas as atv_vagas, a.carga_horaria_minutos as atv_cargaHorariaMinutos, a.cancelada as atv_cancelada
      FROM encontros e
      JOIN atividades a ON e.atividade_id = a.id
      WHERE e.id = ?
    `).get(encontroId) as any;

    if (!row) {
      return null;
    }

    return {
      encounter: {
        id: row.enc_id,
        inicio: row.enc_inicio,
        fim: row.enc_fim
      },
      activity: {
        id: row.atv_id,
        titulo: row.atv_titulo,
        tipo: row.atv_tipo,
        salaId: row.atv_salaId,
        vagas: row.atv_vagas,
        cargaHorariaMinutos: row.atv_cargaHorariaMinutos,
        cancelada: row.atv_cancelada
      }
    };
  }

  update(id: string, fields: { titulo?: string; vagas?: number }): void {
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.titulo !== undefined) {
      sets.push('titulo = ?');
      params.push(fields.titulo);
    }
    if (fields.vagas !== undefined) {
      sets.push('vagas = ?');
      params.push(fields.vagas);
    }
    if (sets.length === 0) {
      return;
    }
    params.push(id);
    this.db.prepare(`UPDATE atividades SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  cancel(id: string): void {
    this.db.prepare(`UPDATE atividades SET cancelada = 1 WHERE id = ?`).run(id);
  }
}
