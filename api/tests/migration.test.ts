import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/migrate.js';

describe('3. Migração da coluna situacao', () => {
  it('migra banco com esquema antigo (tabela atividades com coluna situacao) preservando dados, convertendo cancelada, removendo situacao e sendo idempotente', () => {
    const tmpDir = os.tmpdir();
    const dbPath = path.join(tmpDir, `test-migration-${Date.now()}-${Math.random()}.sqlite`);

    // Cria banco com esquema antigo (contendo coluna situacao)
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        papel TEXT NOT NULL
      );
      CREATE TABLE salas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        capacidade INTEGER NOT NULL
      );
      CREATE TABLE atividades (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        sala_id TEXT NOT NULL,
        vagas INTEGER NOT NULL,
        carga_horaria_minutos INTEGER NOT NULL,
        situacao TEXT NOT NULL
      );
    `);

    // Insere dados de teste no esquema antigo
    db.prepare('INSERT INTO salas (id, nome, capacidade) VALUES (?, ?, ?)').run('sala-101', 'Sala 101', 40);
    db.prepare(`
      INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, situacao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('atv_canc', 'Palestra Cancelada', 'palestra', 'sala-101', 40, 120, 'cancelada');

    db.prepare(`
      INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, situacao)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('atv_prev', 'Palestra Prevista', 'palestra', 'sala-101', 40, 120, 'prevista');

    db.close();

    // Executa a migração atualizada
    const dbMigrated = new Database(dbPath);
    runMigrations(dbMigrated);

    // Confirmações:
    // 1. Dados existentes são preservados
    const atividades = dbMigrated.prepare('SELECT id, titulo, cancelada FROM atividades ORDER BY id').all() as Array<any>;
    expect(atividades.length).toBe(2);

    // 2. Uma atividade anteriormente cancelada passa a possuir cancelada = 1
    const atvCanc = atividades.find(a => a.id === 'atv_canc');
    expect(atvCanc.cancelada).toBe(1);

    // 3. Uma atividade não cancelada possui cancelada = 0
    const atvPrev = atividades.find(a => a.id === 'atv_prev');
    expect(atvPrev.cancelada).toBe(0);

    // 4. A coluna física 'situacao' deixa de existir
    const tableInfo = dbMigrated.prepare("PRAGMA table_info(atividades)").all() as Array<{ name: string }>;
    const hasSituacao = tableInfo.some(col => col.name === 'situacao');
    expect(hasSituacao).toBe(false);

    const hasCancelada = tableInfo.some(col => col.name === 'cancelada');
    expect(hasCancelada).toBe(true);

    // 5. Executar as migrations novamente não causa erro nem perda de dados
    expect(() => runMigrations(dbMigrated)).not.toThrow();
    const atividadesAposSegundaMig = dbMigrated.prepare('SELECT id, cancelada FROM atividades').all();
    expect(atividadesAposSegundaMig.length).toBe(2);

    dbMigrated.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });
});
