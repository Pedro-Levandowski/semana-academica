import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { Bloqueio } from '../api/types';

type UiError = { erro: string; mensagem: string };

function normalizeError(err: any, fallback: string): UiError {
  return {
    erro: err?.erro || 'ERRO_DESCONHECIDO',
    mensagem: err?.mensagem || err?.message || fallback,
  };
}

export function useBloqueios(selectedUserId: string | null, apiClient = api) {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UiError | null>(null);
  const [actionError, setActionError] = useState<UiError | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const atualizar = useCallback(() => {
    setActionError(null);
    setTrigger((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setBloqueios([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiClient.getBloqueios()
      .then((response) => {
        if (active) setBloqueios(response);
      })
      .catch((err: any) => {
        if (active) setError(normalizeError(err, 'Erro ao carregar bloqueios'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiClient, selectedUserId, trigger]);

  const desbloquear = useCallback(async (participanteId: string) => {
    if (removendoId !== null) return;

    setRemovendoId(participanteId);
    setActionError(null);

    try {
      await apiClient.deleteBloqueio(participanteId);
      const response = await apiClient.getBloqueios();
      if (mounted.current) {
        setBloqueios(response);
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) {
        setActionError(normalizeError(err, 'Erro ao desbloquear participante'));
      }
    } finally {
      if (mounted.current) setRemovendoId(null);
    }
  }, [apiClient, removendoId]);

  return {
    bloqueios,
    loading,
    error,
    actionError,
    removendoId,
    atualizar,
    desbloquear,
  };
}
