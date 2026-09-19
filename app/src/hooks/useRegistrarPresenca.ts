import { useState } from 'react';
import { api } from '../api/client';
import { ApiError } from '../api/types';
import { useFilaOffline } from './useFilaOffline';

export function useRegistrarPresenca(encontroId?: string, apiClient = api) {
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  const { fila, adicionarItem, removerItem, sincronizarFila, isOnline } = useFilaOffline(apiClient);

  const registrar = async (codigoParam?: string) => {
    const codeToSubmit = codigoParam !== undefined ? codigoParam : codigo;
    if (!encontroId) {
      setError({ erro: 'ENCONTRO_NAO_INFORMADO', mensagem: 'ID do encontro não informado.' });
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const lidoEm = new Date().toISOString();

    if (!navigator.onLine) {
      adicionarItem({
        encontroId,
        codigo: codeToSubmit,
        lidoEm,
        status: 'pendente',
      });
      setSubmitting(false);
      setCodigo('');
      setSuccessMessage('Leitura guardada localmente. Pendente de sincronização.');
      return;
    }

    try {
      const result = await apiClient.registrarPresenca(encontroId, { codigo: codeToSubmit, lidoEm });
      setSubmitting(false);
      setCodigo('');

      if (result.status === 201) {
        setSuccessMessage('Presença registrada agora.');
      } else if (result.status === 200) {
        setSuccessMessage('Presença já estava registrada.');
      } else {
        setSuccessMessage('Presença registrada com sucesso.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setCodigo('');

      if (err instanceof ApiError) {
        const businessErrors = ['NAO_INSCRITO', 'CODIGO_INVALIDO', 'FORA_DA_JANELA', 'SINCRONIZACAO_TARDIA'];
        if (businessErrors.includes(err.erro)) {
          let mensagem = err.mensagem;
          if (err.erro === 'NAO_INSCRITO') {
            mensagem = 'Participante não elegível.';
          } else if (err.erro === 'CODIGO_INVALIDO') {
            mensagem = 'Código inválido.';
          } else if (err.erro === 'FORA_DA_JANELA') {
            mensagem = 'Fora do horário permitido.';
          }
          adicionarItem({
            encontroId,
            codigo: codeToSubmit,
            lidoEm,
            status: 'falha-definitiva',
            erro: err.erro,
            mensagem,
          });
          setError({ erro: err.erro, mensagem });
        } else {
          adicionarItem({
            encontroId,
            codigo: codeToSubmit,
            lidoEm,
            status: 'pendente',
          });
          setSuccessMessage('Leitura guardada localmente. Pendente de sincronização.');
        }
      } else {
        adicionarItem({
          encontroId,
          codigo: codeToSubmit,
          lidoEm,
          status: 'pendente',
        });
        setSuccessMessage('Leitura guardada localmente. Pendente de sincronização.');
      }
    }
  };

  return {
    codigo,
    setCodigo,
    submitting,
    successMessage,
    error,
    registrar,
    fila,
    isOnline,
    removerItem,
    sincronizarFila,
  };
}
