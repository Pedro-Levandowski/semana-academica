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
      cancelada INTEGER NOT NULL DEFAULT 0,
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

  const tableInfo = db.prepare("PRAGMA table_info(atividades)").all() as Array<{ name: string }>;
  const hasSituacao = tableInfo.some(col => col.name === 'situacao');
  const hasCancelada = tableInfo.some(col => col.name === 'cancelada');
  if (hasSituacao) {
    db.transaction(() => {
      if (!hasCancelada) {
        db.exec(`
          ALTER TABLE atividades ADD COLUMN cancelada INTEGER NOT NULL DEFAULT 0;
          UPDATE atividades SET cancelada = 1 WHERE situacao = 'cancelada';
          UPDATE atividades SET cancelada = 0 WHERE situacao != 'cancelada' OR situacao IS NULL;
        `);
      }
      db.exec(`
        ALTER TABLE atividades DROP COLUMN situacao;
      `);
    })();
  }
}
