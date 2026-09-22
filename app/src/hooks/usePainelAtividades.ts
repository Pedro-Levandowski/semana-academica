import { useState, useEffect, useCallback } from 'react';
import { PainelAtividade } from '../api/types';
import { api } from '../api/client';

export function usePainelAtividades(selectedUserId: string | null, apiClient = api) {
  const [atividades, setAtividades] = useState<PainelAtividade[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  const atualizar = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setAtividades([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient.getPainelAtividades()
      .then((res) => {
        if (isMounted) {
          setAtividades(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err?.erro || 'ERRO_DESCONHECIDO',
            mensagem: err?.mensagem || err?.message || 'Erro ao carregar painel',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedUserId, apiClient, trigger]);

  return {
    atividades,
    loading,
    error,
    atualizar,
  };
}
