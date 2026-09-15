import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createApp } from '../src/app.js';

describe('2. Reset exato do M1', () => {
  it('reseta o M1 removendo salas/usuários extras, mantendo os 10 oficiais, sem duplicação no segundo reset, e restaurando o relógio', async () => {
    const tmpDir = os.tmpdir();
    const dbPath = path.join(tmpDir, `test-reset-${Date.now()}-${Math.random()}.sqlite`);

    const app = createApp({ dbPath, modoTeste: true });

    // Adiciona como fixture uma sala extra e um usuário extra diretamente no SQLite
    const db = new Database(dbPath);
    db.prepare('INSERT INTO salas (id, nome, capacidade) VALUES (?, ?, ?)').run('sala-extra', 'Sala Extra', 10);
    db.prepare('INSERT INTO usuarios (id, nome, papel) VALUES (?, ?, ?)').run('p-extra', 'Usuário Extra', 'participante');
    db.close();

    // Avança o relógio para testar o reset do relógio
    await request(app).put('/_teste/relogio').send({ agora: '2026-10-22T15:00:00-03:00' });

    // Executa POST /_teste/reset
    const resReset = await request(app).post('/_teste/reset');
    expect(resReset.status).toBe(204);

    // Executa reset duas vezes para garantir que não ocorre duplicação
    const resReset2 = await request(app).post('/_teste/reset');
    expect(resReset2.status).toBe(204);

    // Confirma por GET /salas que existem exatamente as quatro salas oficiais e que a sala extra desapareceu
    const resSalas = await request(app).get('/salas').set('X-Usuario', 'org-ana');
    expect(resSalas.status).toBe(200);
    expect(resSalas.body.length).toBe(4);
    const salaIds = resSalas.body.map((s: any) => s.id).sort();
    expect(salaIds).toEqual(['auditorio', 'lab-3', 'sala-101', 'sala-102'].sort());

    // Tenta usar o usuário extra em X-Usuario e confirme 401 USUARIO_DESCONHECIDO
    const resExtraUser = await request(app).get('/salas').set('X-Usuario', 'p-extra');
    expect(resExtraUser.status).toBe(401);
    expect(resExtraUser.body.erro).toBe('USUARIO_DESCONHECIDO');

    // Confirma que os dez usuários oficiais continuam reconhecidos
    const dezUsuarios = [
      'org-ana', 'org-bruno', 'p-carla', 'p-diego', 'p-elisa',
      'p-fabio', 'p-gabriela', 'p-heitor', 'p-isadora', 'p-joao'
    ];
    for (const uid of dezUsuarios) {
      const resU = await request(app).get('/salas').set('X-Usuario', uid);
      expect(resU.status).toBe(200);
    }

    // Confirma o relógio restaurado em 2026-10-13T09:00:00-03:00
    const resRelogio = await request(app).get('/_teste/relogio');
    expect(resRelogio.status).toBe(200);
    expect(resRelogio.body.agora).toBe('2026-10-13T09:00:00-03:00');

    (app as any).close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });
});
