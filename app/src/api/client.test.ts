import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './client';
import { ApiError } from './types';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve listar salas usando GET /salas sem X-Usuario quando nenhum usuário estiver selecionado', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }],
    });
    vi.stubGlobal('fetch', mockFetch);

    const salas = await api.getSalas();

    expect(salas).toEqual([{ id: 'sala-101', nome: 'Sala 101', capacidade: 40 }]);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/salas',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Usuario': expect.any(String),
        }),
      })
    );
  });

  it('deve incluir X-Usuario automaticamente quando houver usuário selecionado no localStorage', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getAtividades();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Usuario': 'org-ana',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('deve passar filtros opcionais em getAtividades', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.getAtividades({ dia: '2026-10-19', tipo: 'palestra' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades?dia=2026-10-19&tipo=palestra',
      expect.any(Object)
    );
  });

  it('deve consultar detalhe de atividade em GET /atividades/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', titulo: 'Teste' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const atv = await api.getAtividade('atv_123');
    expect(atv).toEqual({ id: 'atv_123', titulo: 'Teste' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123',
      expect.any(Object)
    );
  });

  it('deve criar atividade via POST /atividades', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 'atv_123', titulo: 'Nova' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const nova = {
      titulo: 'Nova',
      tipo: 'palestra' as const,
      salaId: 'sala-101',
      vagas: 40,
      encontros: [{ inicio: '2026-10-19T10:00:00-03:00', fim: '2026-10-19T11:00:00-03:00' }],
    };

    const res = await api.createAtividade(nova);
    expect(res).toEqual({ id: 'atv_123', titulo: 'Nova' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(nova),
      })
    );
  });

  it('deve editar atividade via PATCH /atividades/:id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', titulo: 'Editada' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.updateAtividade('atv_123', { titulo: 'Editada' });
    expect(res).toEqual({ id: 'atv_123', titulo: 'Editada' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ titulo: 'Editada' }),
      })
    );
  });

  it('deve cancelar atividade via POST /atividades/:id/cancelamento', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'atv_123', situacao: 'cancelada' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.cancelAtividade('atv_123');
    expect(res).toEqual({ id: 'atv_123', situacao: 'cancelada' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/atividades/atv_123/cancelamento',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('deve lançar ApiError contendo erro e mensagem quando a resposta não for ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ erro: 'USUARIO_DESCONHECIDO', mensagem: 'Usuário não encontrado' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(api.getSalas()).rejects.toThrowError(ApiError);
    try {
      await api.getSalas();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(401);
      expect(err.erro).toBe('USUARIO_DESCONHECIDO');
      expect(err.mensagem).toBe('Usuário não encontrado');
    }
  });
});
