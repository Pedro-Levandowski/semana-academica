import { useState, useEffect, useCallback, useRef } from 'react';
import { CodigoDoEncontro } from '../api/types';
import { api } from '../api/client';

export function useCodigoEncontro(encontroId: string | undefined, apiClient = api) {
  const [codigoEncontro, setCodigoEncontro] = useState<CodigoDoEncontro | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [foraDaJanela, setForaDaJanela] = useState<boolean>(false);
  const [atividadeCancelada, setAtividadeCancelada] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const fetchCodigo = useCallback(async () => {
    if (!encontroId) {
      setCodigoEncontro(null);
      setLoading(false);
      setError(null);
      setForaDaJanela(false);
      setAtividadeCancelada(false);
      clearTimer();
      return;
    }

    setLoading(true);
    setError(null);
    setForaDaJanela(false);
    setAtividadeCancelada(false);

    try {
      const res = await apiClient.getCodigoEncontro(encontroId);
      setCodigoEncontro(res);
      setLoading(false);

      clearTimer();
      if (res.trocaEm) {
        const trocaTime = new Date(res.trocaEm).getTime();
        const now = Date.now();
        const delay = Math.max(1000, trocaTime - now);

        timeoutRef.current = setTimeout(() => {
          fetchCodigo();
        }, delay);
      }
    } catch (err: any) {
      setLoading(false);
      const erroCode = err.erro || 'ERRO_DESCONHECIDO';
      const mensagem = err.mensagem || err.message || 'Erro ao buscar código do encontro';

      if (erroCode === 'FORA_DA_JANELA') {
        setForaDaJanela(true);
        setError({ erro: erroCode, mensagem });
        clearTimer();
      } else if (erroCode === 'ATIVIDADE_CANCELADA') {
        setAtividadeCancelada(true);
        setError({ erro: erroCode, mensagem });
        clearTimer();
      } else {
        setError({ erro: erroCode, mensagem });
        // Retry automatically after 5 seconds for generic network/other errors
        clearTimer();
        timeoutRef.current = setTimeout(() => {
          fetchCodigo();
        }, 5000);
      }
    }
  }, [encontroId, apiClient]);

  useEffect(() => {
    fetchCodigo();
    return () => {
      clearTimer();
    };
  }, [fetchCodigo]);

  return {
    codigoEncontro,
    loading,
    error,
    foraDaJanela,
    atividadeCancelada,
    reload: fetchCodigo,
  };
}
