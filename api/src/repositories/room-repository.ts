import Database from 'better-sqlite3';

export interface Room {
  id: string;
  nome: string;
  capacidade: number;
}

export class RoomRepository {
  constructor(private db: Database.Database) {}

  findAll(): Room[] {
    return this.db.prepare('SELECT id, nome, capacidade FROM salas').all() as Room[];
  }

  findById(id: string): Room | undefined {
    return this.db.prepare('SELECT id, nome, capacidade FROM salas WHERE id = ?').get(id) as Room | undefined;
  }
}
