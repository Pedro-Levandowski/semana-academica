import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFilaOffline } from './useFilaOffline';
import { ApiError } from '../api/types';

describe('useFilaOffline Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('deve salvar item na fila como pendente', () => {
    const { result } = renderHook(() => useFilaOffline());

    act(() => {
      result.current.adicionarItem({
        encontroId: 'enc_1',
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T10:00:00-03:00',
        status: 'pendente',
      });
    });

    expect(result.current.fila).toHaveLength(1);
    expect(result.current.fila[0]).toMatchObject({
      encontroId: 'enc_1',
      codigo: 'K7M2QX',
      status: 'pendente',
    });

    const stored = JSON.parse(localStorage.getItem('fila-offline-presencas') || '[]');
    expect(stored).toHaveLength(1);
  });

  it('deve persistir e carregar a fila do localStorage entre "recarregamentos"', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const initialItem = {
      localId: 'loc_123',
      encontroId: 'enc_1',
      codigo: 'K7M2QX',
      lidoEm: '2026-10-19T10:00:00-03:00',
      status: 'pendente' as const,
    };
    localStorage.setItem('fila-offline-presencas', JSON.stringify([initialItem]));

    const { result } = renderHook(() => useFilaOffline());

    expect(result.current.fila).toHaveLength(1);
    expect(result.current.fila[0]).toEqual(initialItem);
  });

  it('deve tentar sincronizar automaticamente na inicialização se já estiver online e houver itens pendentes no localStorage', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    const initialItem = {
      localId: 'loc_pre_1',
      encontroId: 'enc_1',
      codigo: 'K7M2QX',
      lidoEm: '2026-10-19T10:00:00-03:00',
      status: 'pendente' as const,
    };
    localStorage.setItem('fila-offline-presencas', JSON.stringify([initialItem]));

    const registrarPresencaMock = vi.fn().mockResolvedValue({
      presenca: {},
      status: 201,
    });
    const fakeClient = { registrarPresenca: registrarPresencaMock } as any;

    const { result } = renderHook(() => useFilaOffline(fakeClient));

    await waitFor(() => {
      expect(registrarPresencaMock).toHaveBeenCalledWith('enc_1', {
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T10:00:00-03:00',
      });
      expect(result.current.fila).toHaveLength(0);
    });
  });

  it('deve sincronizar automaticamente itens pendentes quando a rede voltar com sucesso', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const registrarPresencaMock = vi.fn().mockResolvedValue({
      presenca: {},
      status: 201,
    });
    const fakeClient = { registrarPresenca: registrarPresencaMock } as any;

    const { result } = renderHook(() => useFilaOffline(fakeClient));

    act(() => {
      result.current.adicionarItem({
        encontroId: 'enc_1',
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T10:00:00-03:00',
        status: 'pendente',
      });
    });

    expect(result.current.fila).toHaveLength(1);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(registrarPresencaMock).toHaveBeenCalledWith('enc_1', {
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T10:00:00-03:00',
      });
      expect(result.current.fila).toHaveLength(0);
    });
  });

  it('deve marcar como falha-definitiva e manter na fila se ocorrer erro de negócio definitivo', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    const registrarPresencaMock = vi.fn().mockRejectedValue(
      new ApiError(403, 'NAO_INSCRITO', 'Participante não inscrito.')
    );
    const fakeClient = { registrarPresenca: registrarPresencaMock } as any;

    const { result } = renderHook(() => useFilaOffline(fakeClient));

    act(() => {
      result.current.adicionarItem({
        encontroId: 'enc_1',
        codigo: 'K7M2QX',
        lidoEm: '2026-10-19T10:00:00-03:00',
        status: 'pendente',
      });
    });

    act(() => {
      result.current.sincronizarFila();
    });

    await waitFor(() => {
      expect(result.current.fila).toHaveLength(1);
      expect(result.current.fila[0].status).toBe('falha-definitiva');
      expect(result.current.fila[0].erro).toBe('NAO_INSCRITO');
      expect(result.current.fila[0].mensagem).toBe('Participante não elegível.');
    });
  });
});
