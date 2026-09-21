import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { ApiError } from '../api/types';

export interface ItemFilaOffline {
  localId: string;
  encontroId: string;
  codigo: string;
  lidoEm: string;
  status: 'pendente' | 'sincronizando' | 'concluido' | 'falha-definitiva';
  erro?: string;
  mensagem?: string;
}

const STORAGE_KEY = 'fila-offline-presencas';

export function useFilaOffline(apiClient = api) {
  const [fila, setFila] = useState<ItemFilaOffline[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const isSyncingRef = useRef(false);
  const filaRef = useRef(fila);

  useEffect(() => {
    filaRef.current = fila;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fila));
    } catch {
      // ignore
    }
  }, [fila]);

  const sincronizarProximo = useCallback(async () => {
    if (isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;

    try {
      while (true) {
        const targetItem = filaRef.current.find((item) => item.status === 'pendente');
        if (!targetItem) {
          break;
        }

        setFila((prev) =>
          prev.map((item) =>
            item.localId === targetItem.localId ? { ...item, status: 'sincronizando' } : item
          )
        );

        try {
          await apiClient.registrarPresenca(targetItem.encontroId, {
            codigo: targetItem.codigo,
            lidoEm: targetItem.lidoEm,
          });

          // Success -> remove from queue
          setFila((prev) => prev.filter((item) => item.localId !== targetItem.localId));
        } catch (err: any) {
          if (err instanceof ApiError) {
            const businessErrors = ['NAO_INSCRITO', 'CODIGO_INVALIDO', 'FORA_DA_JANELA', 'SINCRONIZACAO_TARDIA'];
            if (businessErrors.includes(err.erro) || (err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429)) {
              let mensagem = err.mensagem;
              if (err.erro === 'NAO_INSCRITO') mensagem = 'Participante não elegível.';
              else if (err.erro === 'CODIGO_INVALIDO') mensagem = 'Código inválido.';
              else if (err.erro === 'FORA_DA_JANELA') mensagem = 'Fora do horário permitido.';

              setFila((prev) =>
                prev.map((item) =>
                  item.localId === targetItem.localId
                    ? { ...item, status: 'falha-definitiva', erro: err.erro, mensagem }
                    : item
                )
              );
            } else {
              setFila((prev) =>
                prev.map((item) =>
                  item.localId === targetItem.localId ? { ...item, status: 'pendente' } : item
                )
              );
              break;
            }
          } else {
            setFila((prev) =>
              prev.map((item) =>
                item.localId === targetItem.localId ? { ...item, status: 'pendente' } : item
              )
            );
            break;
          }
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [apiClient]);

  // Attempt sync on mount if online and there are pending items (handling app reload)
  useEffect(() => {
    if (navigator.onLine && filaRef.current.some((item) => item.status === 'pendente')) {
      sincronizarProximo();
    }
  }, [sincronizarProximo]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sincronizarProximo();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizarProximo]);

  const adicionarItem = useCallback((item: Omit<ItemFilaOffline, 'localId'> & { localId?: string }) => {
    const novoItem: ItemFilaOffline = {
      localId: item.localId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      encontroId: item.encontroId,
      codigo: item.codigo,
      lidoEm: item.lidoEm || new Date().toISOString(),
      status: item.status || 'pendente',
      erro: item.erro,
      mensagem: item.mensagem,
    };

    setFila((prev) => [...prev, novoItem]);
    return novoItem;
  }, []);

  const removerItem = useCallback((localId: string) => {
    setFila((prev) => prev.filter((item) => item.localId !== localId));
  }, []);

  return {
    fila,
    adicionarItem,
    removerItem,
    sincronizarFila: sincronizarProximo,
    isOnline,
  };
}
