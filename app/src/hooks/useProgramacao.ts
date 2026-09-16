import { useState, useEffect } from 'react';
import { Atividade, Sala } from '../api/types';
import { api } from '../api/client';

export const DIAS_SEMANA = [
  { data: '2026-10-19', label: '19/10/2026 (Seg)' },
  { data: '2026-10-20', label: '20/10/2026 (Ter)' },
  { data: '2026-10-21', label: '21/10/2026 (Qua)' },
  { data: '2026-10-22', label: '22/10/2026 (Qui)' },
  { data: '2026-10-23', label: '23/10/2026 (Sex)' },
];

export function useProgramacao(selectedUserId: string | null, apiClient = api) {
  const [dia, setDia] = useState<string>('2026-10-19');
  const [tipo, setTipo] = useState<string>('');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  useEffect(() => {
    if (!selectedUserId) {
      setAtividades([]);
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
      apiClient.getAtividades({
        dia,
        tipo: tipo ? (tipo as 'palestra' | 'minicurso') : undefined,
      }),
    ])
      .then(([salasRes, atividadesRes]) => {
        if (isMounted) {
          setSalas(salasRes);
          setAtividades(atividadesRes);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError({
            erro: err.erro || 'ERRO_DESCONHECIDO',
            mensagem: err.mensagem || err.message || 'Erro ao carregar programação',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedUserId, dia, tipo, apiClient]);

  return {
    dia,
    setDia,
    tipo,
    setTipo,
    atividades,
    salas,
    loading,
    error,
    DIAS_SEMANA,
  };
}
