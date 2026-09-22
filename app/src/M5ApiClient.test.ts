import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api/client';

describe('M5 - API Client (Painel)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve consultar getPainelAtividades usando GET /painel/atividades com X-Usuario e Content-Type, preservando a resposta', async () => {
    localStorage.setItem('selectedUserId', 'org-ana');
    const mockData = [
      {
        atividadeId: 'atv-1',
        titulo: 'Palestra Teste',
        vagas: 10,
        ocupadas: 5,
        emEspera: 0,
        ocupacaoPercentual: 50,
        frequenciaPercentual: 100,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await api.getPainelAtividades();

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/painel/atividades',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Usuario': 'org-ana',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
