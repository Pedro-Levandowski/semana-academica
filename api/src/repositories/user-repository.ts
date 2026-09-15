import Database from 'better-sqlite3';

export interface User {
  id: string;
  nome: string;
  papel: string;
}

export class UserRepository {
  constructor(private db: Database.Database) {}

  findById(id: string): User | undefined {
    return this.db.prepare('SELECT id, nome, papel FROM usuarios WHERE id = ?').get(id) as User | undefined;
  }
}
