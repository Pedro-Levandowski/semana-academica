import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAtividadeDetalhe } from '../hooks/useAtividadeDetalhe';
import { M2ExtensionPoint } from './M2ExtensionPoint';
import { api } from '../api/client';
import { formatarDataHoraBrasilia } from '../utils/date';

interface AtividadeDetalheProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function AtividadeDetalhe({ selectedUserId, userPapel, apiClient = api }: AtividadeDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const { atividade, salas, loading, error, reload } = useAtividadeDetalhe(id, selectedUserId, apiClient);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(null);

  const isCancelada = atividade?.situacao === 'cancelada';

  const getSalaNome = (salaId: string) => {
    const sala = salas.find((s) => s.id === salaId);
    return sala ? sala.nome : salaId;
  };

  const handleConfirmCancel = async () => {
    if (cancelling || !atividade) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await apiClient.cancelAtividade(atividade.id);
      setCancelSuccessMessage('Atividade cancelada com sucesso!');
      setCancelling(false);
      setShowCancelConfirm(false);
      reload();
    } catch (err: any) {
      setCancelError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao cancelar atividade',
      });
      setCancelling(false);
    }
  };

  if (!selectedUserId) {
    return (
      <div>
        <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
        <p>
          <Link to="/">Voltar para a programação</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="atividade-detalhe-container" style={{ padding: '1rem 0' }}>
      <p>
        <Link to="/" className="voltar-link">Voltar para a programação</Link>
      </p>

      {userPapel === 'organizacao' && atividade && !isCancelada && !cancelSuccessMessage && (
        <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
          <Link
            to={`/atividades/${atividade.id}/editar`}
            className="editar-atividade-link"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#ffc107',
              color: '#000',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Editar atividade
          </Link>

          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="cancelar-atividade-btn"
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancelar atividade
          </button>
        </div>
      )}

      {showCancelConfirm && (
        <div
          className="cancel-confirm-box"
          role="alertdialog"
          aria-labelledby="cancel-dialog-title"
          aria-modal="true"
          style={{ border: '1px solid #dc3545', padding: '1rem', margin: '1rem 0', borderRadius: '4px', backgroundColor: '#fff5f5' }}
        >
          <p id="cancel-dialog-title">Tem certeza de que deseja cancelar esta atividade?</p>
          {cancelError && (
            <div className="error-message" role="alert" style={{ color: 'red', margin: '0.5rem 0' }}>
              Erro ({cancelError.erro}): {cancelError.mensagem}
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleConfirmCancel}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: cancelling ? '#cccccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: cancelling ? 'not-allowed' : 'pointer',
              }}
            >
              {cancelling ? 'Cancelando atividade...' : 'Confirmar cancelamento'}
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setShowCancelConfirm(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: cancelling ? 'not-allowed' : 'pointer',
              }}
            >
              Manter atividade
            </button>
          </div>
        </div>
      )}

      {cancelSuccessMessage && (
        <div className="success-message" role="status" aria-live="polite" style={{ color: 'green', margin: '1rem 0' }}>
          {cancelSuccessMessage}
        </div>
      )}

      {loading && <p role="status" aria-live="polite">Carregando atividade...</p>}

      {error && (
        <div className="error-message" role="alert">
          Erro ({error.erro}): {error.mensagem}
        </div>
      )}

      {!loading && !error && atividade && (
        <div>
          {isCancelada && (
            <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '1rem' }}>
              Atividade Cancelada
            </div>
          )}

          <h2 data-testid="detalhe-titulo">{atividade.titulo}</h2>
          <p><strong>Tipo:</strong> <span data-testid="detalhe-tipo">{atividade.tipo}</span></p>
          <p><strong>Sala:</strong> <span data-testid="detalhe-sala">{getSalaNome(atividade.salaId)}</span></p>
          <p><strong>Vagas:</strong> <span data-testid="detalhe-vagas">{atividade.vagas}</span></p>
          <p><strong>Carga Horária:</strong> <span data-testid="detalhe-carga">{atividade.cargaHorariaMinutos}</span> minutos</p>
          <p><strong>Situação:</strong> <span data-testid="detalhe-situacao">{atividade.situacao}</span></p>
          <p><strong>Ocupadas:</strong> <span data-testid="detalhe-ocupadas">{atividade.ocupadas}</span></p>
          <p><strong>Vagas Restantes:</strong> <span data-testid="detalhe-vagas-restantes">{atividade.vagasRestantes}</span></p>
          <p><strong>Pessoas em Espera:</strong> <span data-testid="detalhe-em-espera">{atividade.emEspera}</span></p>

          <h3>Encontros</h3>
          {atividade.encontros && atividade.encontros.length > 0 ? (
            <ul>
              {atividade.encontros.map((enc) => (
                <li key={enc.id}>
                  Início: {formatarDataHoraBrasilia(enc.inicio)} | Fim: {formatarDataHoraBrasilia(enc.fim)}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum encontro cadastrado.</p>
          )}

          <M2ExtensionPoint />
        </div>
      )}
    </div>
  );
}
