import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('1. Inicialização não destrutiva', () => {
  it('comprova que reiniciar a aplicação apontando para o mesmo banco SQLite não apaga atividades', async () => {
    const tmpDir = os.tmpdir();
    const dbPath = path.join(tmpDir, `test-db-${Date.now()}-${Math.random()}.sqlite`);

    // 1. Cria a aplicação no banco temporário
    const app1 = createApp({ dbPath, modoTeste: true });

    // Prepara uma atividade como fixture de infraestrutura diretamente no SQLite
    const db = new Database(dbPath);
    db.prepare(`
      INSERT INTO atividades (id, titulo, tipo, sala_id, vagas, carga_horaria_minutos, cancelada)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('atv_fixture1', 'Atividade Teste Fixture', 'palestra', 'sala-101', 30, 120, 0);
    db.prepare(`
      INSERT INTO encontros (id, atividade_id, inicio, fim)
      VALUES (?, ?, ?, ?)
    `).run('enc_fixture1', 'atv_fixture1', '2026-10-19T10:00:00-03:00', '2026-10-19T12:00:00-03:00');
    db.close();

    // Fecha completamente a aplicação 1
    (app1 as any).close();

    // 2. Cria novamente a aplicação apontando para o mesmo banco
    const app2 = createApp({ dbPath, modoTeste: true });

    // 3. Consulta GET /atividades com X-Usuario válido
    const response = await request(app2).get('/atividades').set('X-Usuario', 'p-carla');

    // 4. Comprova que a atividade não foi apagada pela reinicialização
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe('atv_fixture1');
    expect(response.body[0].titulo).toBe('Atividade Teste Fixture');

    (app2 as any).close();

    // Cleanup
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });
});
