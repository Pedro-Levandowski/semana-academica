import { useState, useEffect, useCallback } from 'react';
import { SemChance } from '../api/types';
import { api } from '../api/client';

export function useSemChance(atividadeId: string | undefined, selectedUserId: string | null, apiClient = api) {
  const [participantes, setParticipantes] = useState<SemChance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [trigger, setTrigger] = useState<number>(0);

  const atualizar = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!selectedUserId || !atividadeId) {
      setParticipantes([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient.getSemChance(atividadeId)
      .then((res) => {
        if (isMounted) {
          setParticipantes(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err?.erro || 'ERRO_DESCONHECIDO',
            mensagem: err?.mensagem || err?.message || 'Erro ao carregar relatório',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [atividadeId, selectedUserId, apiClient, trigger]);

  return {
    participantes,
    loading,
    error,
    atualizar,
  };
}
