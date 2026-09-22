import { useState, useEffect } from 'react';
import { Extrato } from '../api/types';
import { api } from '../api/client';

export function useExtrato(apiClient = api) {
  const [extrato, setExtrato] = useState<Extrato | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .getExtrato()
      .then((res) => {
        if (isMounted) {
          setExtrato(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err.erro || 'ERRO_DESCONHECIDO',
            mensagem: err.mensagem || err.message || 'Erro ao carregar extrato',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  return {
    extrato,
    loading,
    error,
  };
}
