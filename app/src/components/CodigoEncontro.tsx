import React from 'react';
import { Link } from 'react-router-dom';
import { useCodigoEncontro } from '../hooks/useCodigoEncontro';
import { api } from '../api/client';
import { formatarHoraBrasilia } from '../utils/date';

interface CodigoEncontroProps {
  encontroId?: string;
  id?: string;
  apiClient?: typeof api;
  selectedUserId?: string | null;
  userPapel?: string;
}

export function CodigoEncontro({
  encontroId,
  id,
  apiClient = api,
  selectedUserId,
  userPapel,
}: CodigoEncontroProps) {
  if (selectedUserId === null || (userPapel !== undefined && userPapel !== 'organizacao')) {
    return (
      <section className="state-panel">
        <span className="eyebrow">Acesso restrito</span>
        <h2>Área exclusiva da organização</h2>
        <p>Acesso negado ou usuário não autorizado.</p>

        <Link to="/" className="button button--secondary">
          Voltar para a programação
        </Link>
      </section>
    );
  }

  const targetId = encontroId || id;
  const {
    codigoEncontro,
    loading,
    error,
    foraDaJanela,
    atividadeCancelada,
  } = useCodigoEncontro(targetId, apiClient);

  return (
    <section className="codigo-encontro-container" data-testid="codigo-encontro-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Organização do encontro</span>
          <h2>Código de Verificação</h2>
          <p>Exibição em tempo real do código atual para registro de presença.</p>
        </div>
      </div>

      {loading && (
        <div className="state-message state-message--loading" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando código do encontro...</span>
        </div>
      )}

      {foraDaJanela && error && (
        <div className="error-message error-message--fora-janela" role="alert" data-testid="error-fora-janela">
          <strong>Fora do horário permitido.</strong>
          <span>{error.mensagem}</span>
        </div>
      )}

      {atividadeCancelada && error && !foraDaJanela && (
        <div className="error-message error-message--cancelada" role="alert" data-testid="error-cancelada">
          <strong>Atividade cancelada.</strong>
          <span>{error.mensagem}</span>
        </div>
      )}

      {error && !foraDaJanela && !atividadeCancelada && (
        <div className="error-message" role="alert" data-testid="error-generico">
          <strong>Não foi possível carregar o código do encontro.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loading && !error && codigoEncontro && (
        <div className="codigo-destaque-panel" data-testid="codigo-destaque">
          <div className="codigo-destaque-card">
            <span className="codigo-destaque-label">Código atual do encontro</span>
            <strong className="codigo-destaque-valor" data-testid="codigo-valor">
              {codigoEncontro.codigo}
            </strong>
          </div>

          <div className="proxima-troca-info" data-testid="proxima-troca">
            <span className="proxima-troca-icon" aria-hidden="true">⏱</span>
            <span>
              Próxima troca em: <strong>{formatarHoraBrasilia(codigoEncontro.trocaEm)}</strong>
            </span>
          </div>
        </div>
      )}

      {!loading && !error && !codigoEncontro && targetId && (
        <div className="empty-message" role="status" aria-live="polite">
          <strong>Nenhum código disponível</strong>
          <p>Não foi possível obter o código para este encontro no momento.</p>
        </div>
      )}
    </section>
  );
}
