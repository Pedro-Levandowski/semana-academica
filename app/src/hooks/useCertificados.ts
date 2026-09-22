import { useState, useEffect, useCallback } from 'react';
import { Certificado } from '../api/types';
import { api } from '../api/client';

export function useCertificados(apiClient = api) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  const carregarCertificados = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.getCertificados();
      setCertificados(res);
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao carregar certificados',
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    carregarCertificados();
  }, [carregarCertificados]);

  return {
    certificados,
    loading,
    error,
    recarregar: carregarCertificados,
  };
}