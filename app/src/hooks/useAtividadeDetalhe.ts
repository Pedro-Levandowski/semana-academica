import { useState, useEffect } from 'react';
import { Atividade, Sala } from '../api/types';
import { api } from '../api/client';

export function useAtividadeDetalhe(id: string | undefined, selectedUserId: string | null, apiClient = api) {
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  useEffect(() => {
    if (!id || !selectedUserId) {
      setAtividade(null);
      setSalas([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.getSalas(),
      apiClient.getAtividade(id),
    ])
      .then(([salasRes, atvRes]) => {
        if (isMounted) {
          setSalas(salasRes);
          setAtividade(atvRes);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err.erro || 'ERRO_DESCONHECIDO',
            mensagem: err.mensagem || err.message || 'Erro ao carregar detalhes da atividade',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, selectedUserId, apiClient]);

  return {
    atividade,
    salas,
    loading,
    error,
  };
}
