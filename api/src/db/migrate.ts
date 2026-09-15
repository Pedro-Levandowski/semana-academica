import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      papel TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      capacidade INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS atividades (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      sala_id TEXT NOT NULL,
      vagas INTEGER NOT NULL,
      carga_horaria_minutos INTEGER NOT NULL,
      situacao TEXT NOT NULL,
      FOREIGN KEY (sala_id) REFERENCES salas(id)
    );

    CREATE TABLE IF NOT EXISTS encontros (
      id TEXT PRIMARY KEY,
      atividade_id TEXT NOT NULL,
      inicio TEXT NOT NULL,
      fim TEXT NOT NULL,
      FOREIGN KEY (atividade_id) REFERENCES atividades(id)
    );

    CREATE TABLE IF NOT EXISTS relogio_estado (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      agora TEXT NOT NULL
    );
  `);
}
