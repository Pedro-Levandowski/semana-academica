import { useState } from 'react';
import { api } from '../api/client';
import { ApiError } from '../api/types';

export function useRegistrarPresenca(encontroId?: string, apiClient = api) {
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  const registrar = async (codigoParam?: string) => {
    const codeToSubmit = codigoParam !== undefined ? codigoParam : codigo;
    if (!encontroId) {
      setError({ erro: 'ENCONTRO_NAO_INFORMADO', mensagem: 'ID do encontro não informado.' });
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await apiClient.registrarPresenca(encontroId, { codigo: codeToSubmit });
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
        let mensagem = err.mensagem;
        if (err.erro === 'NAO_INSCRITO') {
          mensagem = 'Participante não elegível.';
        } else if (err.erro === 'CODIGO_INVALIDO') {
          mensagem = 'Código inválido.';
        } else if (err.erro === 'FORA_DA_JANELA') {
          mensagem = 'Fora do horário permitido.';
        }
        setError({ erro: err.erro, mensagem });
      } else {
        setError({
          erro: 'ERRO_REDE',
          mensagem: 'Sem conexão / Erro de rede',
        });
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
  };
}
