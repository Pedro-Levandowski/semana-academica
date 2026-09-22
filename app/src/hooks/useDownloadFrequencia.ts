import { useCallback, useState } from 'react';
import { api } from '../api/client';

type UiError = { erro: string; mensagem: string };

function normalizeError(err: any): UiError {
  return {
    erro: err?.erro || 'ERRO_DESCONHECIDO',
    mensagem: err?.mensagem || err?.message || 'Erro ao exportar frequência',
  };
}

export function useDownloadFrequencia(apiClient = api) {
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [error, setError] = useState<UiError | null>(null);

  const baixar = useCallback(async (atividadeId: string) => {
    if (baixandoId !== null) return;

    setBaixandoId(atividadeId);
    setError(null);

    try {
      const arquivo = await apiClient.downloadFrequenciaCsv(atividadeId);
      const url = URL.createObjectURL(arquivo.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = arquivo.nomeArquivo;
      link.hidden = true;
      document.body.appendChild(link);

      try {
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError(normalizeError(err));
    } finally {
      setBaixandoId(null);
    }
  }, [apiClient, baixandoId]);

  return { baixar, baixandoId, error };
}
