import { useState } from 'react';
import { api } from '../api/client';
import { ApiError } from '../api/types';

export function useRegistrarPresencaManual(encontroId?: string, apiClient = api) {
  const [participanteId, setParticipanteId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);

  const registrarManual = async () => {
    if (!encontroId) {
      setError({ erro: 'ENCONTRO_NAO_INFORMADO', mensagem: 'ID do encontro não informado.' });
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await apiClient.registrarPresencaManual(encontroId, {
        participanteId: participanteId.trim(),
        justificativa: justificativa.trim(),
      });
      setSubmitting(false);
      setParticipanteId('');
      setJustificativa('');

      const status = (result as any).status !== undefined ? (result as any).status : 201;
      if (status === 201) {
        setSuccessMessage('Presença manual registrada agora.');
      } else if (status === 200) {
        setSuccessMessage('Presença já existia.');
      } else {
        setSuccessMessage('Presença manual registrada com sucesso.');
      }
    } catch (err: any) {
      setSubmitting(false);

      if (err instanceof ApiError) {
        let mensagem = err.mensagem;
        if (err.erro === 'JUSTIFICATIVA_OBRIGATORIA') {
          mensagem = 'A justificativa é obrigatória (mínimo 10 caracteres).';
        } else if (err.erro === 'NAO_INSCRITO') {
          mensagem = 'Participante não elegível.';
        } else if (err.erro === 'FORA_DA_JANELA') {
          mensagem = 'Fora do horário permitido para lançamento manual.';
        } else if (err.erro === 'LIMITE_DE_MANUAIS') {
          mensagem = 'Limite de presenças manuais atingido para este encontro.';
        }
        setError({ erro: err.erro, mensagem });
      } else {
        setError({
          erro: 'ERRO_DE_REDE',
          mensagem: err.message || 'Erro de rede genérico.',
        });
      }
    }
  };

  return {
    participanteId,
    setParticipanteId,
    justificativa,
    setJustificativa,
    submitting,
    successMessage,
    error,
    registrarManual,
  };
}
