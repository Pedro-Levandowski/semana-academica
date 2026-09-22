import { useState, useEffect } from 'react';
import { Certificado } from '../api/types';
import { api } from '../api/client';

export function useCertificados(apiClient = api) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .getCertificados()
      .then((res) => {
        if (isMounted) {
          setCertificados(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err.erro || 'ERRO_DESCONHECIDO',
            mensagem: err.mensagem || err.message || 'Erro ao carregar certificados',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  return {
    certificados,
    loading,
    error,
  };
}