import Database from 'better-sqlite3';
import { Clock } from '../clock/clock.js';
import { DatabaseControllableClock } from '../clock/controllable-clock.js';
import { runMigrations } from './migrate.js';

const OFICIAL_USUARIOS = [
  ['org-ana', 'Ana Beatriz Lima', 'organizacao'],
  ['org-bruno', 'Bruno Tavares', 'organizacao'],
  ['p-carla', 'Carla Mendes Souza', 'participante'],
  ['p-diego', 'Diego Alves', 'participante'],
  ['p-elisa', 'Elisa Fernandes da Rocha', 'participante'],
  ['p-fabio', 'Fábio Nogueira', 'participante'],
  ['p-gabriela', 'Gabriela Moura Castro', 'participante'],
  ['p-heitor', 'Heitor Campos', 'participante'],
  ['p-isadora', 'Isadora Ribeiro dos Santos', 'participante'],
  ['p-joao', 'João Pedro Martins', 'participante']
];

const OFICIAL_SALAS = [
  ['auditorio', 'Auditório Central', 200],
  ['sala-101', 'Sala 101', 40],
  ['sala-102', 'Sala 102', 40],
  ['lab-3', 'Laboratório 3', 20]
];

export function runSeed(db: Database.Database, clock?: Clock): void {
  const insertUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (id, nome, papel) VALUES (?, ?, ?)');
  const insertSala = db.prepare('INSERT OR IGNORE INTO salas (id, nome, capacidade) VALUES (?, ?, ?)');
  const insertRelogio = db.prepare('INSERT OR IGNORE INTO relogio_estado (id, agora) VALUES (1, ?)');

  db.transaction(() => {
    for (const u of OFICIAL_USUARIOS) {
      insertUsuario.run(u[0], u[1], u[2]);
    }
    for (const s of OFICIAL_SALAS) {
      insertSala.run(s[0], s[1], s[2]);
    }

    if (clock && clock instanceof DatabaseControllableClock) {
      const existing = db.prepare('SELECT agora FROM relogio_estado WHERE id = 1').get();
      if (!existing) {
        clock.reset();
      }
    } else {
      insertRelogio.run('2026-10-13T09:00:00-03:00');
    }
  })();
}

export function runReset(db: Database.Database, clock?: Clock): void {
  runMigrations(db);

  const insertUsuario = db.prepare('INSERT INTO usuarios (id, nome, papel) VALUES (?, ?, ?)');
  const insertSala = db.prepare('INSERT INTO salas (id, nome, capacidade) VALUES (?, ?, ?)');
  const insertRelogio = db.prepare('INSERT OR REPLACE INTO relogio_estado (id, agora) VALUES (1, ?)');

  db.transaction(() => {
    db.prepare('DELETE FROM encontros').run();
    db.prepare('DELETE FROM atividades').run();
    db.prepare('DELETE FROM usuarios').run();
    db.prepare('DELETE FROM salas').run();
    db.prepare('DELETE FROM relogio_estado').run();

    for (const u of OFICIAL_USUARIOS) {
      insertUsuario.run(u[0], u[1], u[2]);
    }
    for (const s of OFICIAL_SALAS) {
      insertSala.run(s[0], s[1], s[2]);
    }

    if (clock && clock instanceof DatabaseControllableClock) {
      clock.reset();
    } else {
      insertRelogio.run('2026-10-13T09:00:00-03:00');
    }
  })();
}
