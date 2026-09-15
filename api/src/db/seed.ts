import Database from 'better-sqlite3';

export function runSeed(db: Database.Database): void {
  const insertUsuario = db.prepare('INSERT OR REPLACE INTO usuarios (id, nome, papel) VALUES (?, ?, ?)');
  const usuarios = [
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

  const insertSala = db.prepare('INSERT OR REPLACE INTO salas (id, nome, capacidade) VALUES (?, ?, ?)');
  const salas = [
    ['auditorio', 'Auditório Central', 200],
    ['sala-101', 'Sala 101', 40],
    ['sala-102', 'Sala 102', 40],
    ['lab-3', 'Laboratório 3', 20]
  ];

  const insertRelogio = db.prepare('INSERT OR REPLACE INTO relogio_estado (id, agora) VALUES (1, ?)');

  db.transaction(() => {
    for (const u of usuarios) {
      insertUsuario.run(u[0], u[1], u[2]);
    }
    for (const s of salas) {
      insertSala.run(s[0], s[1], s[2]);
    }
    insertRelogio.run('2026-10-13T09:00:00-03:00');
  })();
}
