import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Esqueleto', () => {
  const app = createApp();

  it('deve retornar 404 e JSON no formato do contrato para rota inexistente', async () => {
    const response = await request(app).get('/rota-que-nao-existe');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      erro: 'NAO_ENCONTRADO',
      mensagem: 'Recurso não encontrado'
    });
  });

  it('deve listar as salas iniciais', async () => {
    const response = await request(app).get('/salas');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });
});
