import { DateTime } from 'luxon';
import Database from 'better-sqlite3';
import { Clock } from './clock.js';

export interface ControllableClock extends Clock {
  set(time: string | DateTime): void;
  reset(): void;
  getIso(): string;
}

export class DatabaseControllableClock implements ControllableClock {
  constructor(private db: Database.Database) {}

  now(): DateTime {
    return DateTime.fromISO(this.getIso(), { setZone: true });
  }

  getIso(): string {
    const row = this.db.prepare('SELECT agora FROM relogio_estado WHERE id = 1').get() as { agora: string };
    return row ? row.agora : '2026-10-13T09:00:00-03:00';
  }

  set(time: string | DateTime): void {
    const iso = typeof time === 'string' ? time : time.toISO();
    if (!iso) throw new Error('Data inválida');
    this.db.prepare('INSERT OR REPLACE INTO relogio_estado (id, agora) VALUES (1, ?)').run(iso);
  }

  reset(): void {
    this.db.prepare('INSERT OR REPLACE INTO relogio_estado (id, agora) VALUES (1, ?)').run('2026-10-13T09:00:00-03:00');
  }
}
