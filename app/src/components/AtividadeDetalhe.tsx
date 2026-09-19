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

export function AtividadeDetalhe({
  selectedUserId,
  userPapel,
  apiClient = api,
}: AtividadeDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const { atividade, salas, loading, error, reload } = useAtividadeDetalhe(
    id,
    selectedUserId,
    apiClient,
  );

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<{
    erro: string;
    mensagem: string;
  } | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(
    null,
  );

  const isCancelada = atividade?.situacao === 'cancelada';

  const getSalaNome = (salaId: string) => {
    const sala = salas.find((item) => item.id === salaId);
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
        mensagem:
          err.mensagem || err.message || 'Erro ao cancelar atividade',
      });
      setCancelling(false);
    }
  };

  if (!selectedUserId) {
    return (
      <section className="state-panel">
        <span className="eyebrow">Seleção necessária</span>
        <h2>Escolha um usuário para continuar</h2>
        <p>
          Nenhum usuário selecionado. Por favor, selecione um usuário de
          demonstração para acessar o sistema.
        </p>

        <Link to="/" className="button button--secondary">
          Voltar para a programação
        </Link>
      </section>
    );
  }

  return (
    <section className="atividade-detalhe-container">
      <Link to="/" className="back-link voltar-link">
        Voltar para a programação
      </Link>

      {loading && (
        <div className="state-message state-message--loading" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando atividade...</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível carregar a atividade.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loading && !error && atividade && (
        <article className="detail-card">
          <header className="detail-hero">
            <div className="detail-hero__content">
              <span className="eyebrow">Detalhes da atividade</span>

              <h2 id="activity-title" data-testid="detalhe-titulo">
                {atividade.titulo}
              </h2>

              <div className="detail-hero__badges">
                <span className="type-badge" data-testid="detalhe-tipo">
                  {atividade.tipo}
                </span>

                <span
                  className={`status-badge status-badge--${atividade.situacao}`}
                  data-testid="detalhe-situacao"
                >
                  {atividade.situacao}
                </span>

                {isCancelada && (
                  <span className="cancelled-detail-marker">
                    Atividade Cancelada
                  </span>
                )}
              </div>
            </div>

            {userPapel === 'organizacao' &&
              !isCancelada &&
              !cancelSuccessMessage && (
                <div className="detail-actions">
                  <Link
                    to={`/atividades/${atividade.id}/editar`}
                    className="button button--secondary editar-atividade-link"
                  >
                    Editar atividade
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="button button--danger cancelar-atividade-btn"
                  >
                    Cancelar atividade
                  </button>
                </div>
              )}
          </header>

          {showCancelConfirm && (
            <div
              className="cancel-confirm-box"
              role="alertdialog"
              aria-labelledby="cancel-dialog-title"
              aria-modal="true"
            >
              <div className="cancel-confirm-box__content">
                <span className="cancel-confirm-box__icon" aria-hidden="true">
                  !
                </span>

                <div>
                  <h3 id="cancel-dialog-title">
                    Tem certeza de que deseja cancelar esta atividade?
                  </h3>
                  <p>
                    O cancelamento é definitivo e a atividade continuará visível
                    na programação.
                  </p>
                </div>
              </div>

              {cancelError && (
                <div className="error-message" role="alert">
                  Erro ({cancelError.erro}): {cancelError.mensagem}
                </div>
              )}

              <div className="cancel-confirm-box__actions">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="button button--danger"
                >
                  {cancelling
                    ? 'Cancelando atividade...'
                    : 'Confirmar cancelamento'}
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setShowCancelConfirm(false)}
                  className="button button--ghost"
                >
                  Manter atividade
                </button>
              </div>
            </div>
          )}

          {cancelSuccessMessage && (
            <div
              className="success-message"
              role="status"
              aria-live="polite"
            >
              {cancelSuccessMessage}
            </div>
          )}

          <section className="detail-section" aria-labelledby="metricas-title">
            <div className="section-heading">
              <span className="eyebrow">Disponibilidade</span>
              <h3 id="metricas-title">Vagas da atividade</h3>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <span>Total de vagas</span>
                <strong data-testid="detalhe-vagas">{atividade.vagas}</strong>
              </div>

              <div className="metric-card">
                <span>Ocupadas</span>
                <strong data-testid="detalhe-ocupadas">
                  {atividade.ocupadas}
                </strong>
              </div>

              <div className="metric-card metric-card--highlight">
                <span>Vagas restantes</span>
                <strong data-testid="detalhe-vagas-restantes">
                  {atividade.vagasRestantes}
                </strong>
              </div>

              <div className="metric-card">
                <span>Pessoas em espera</span>
                <strong data-testid="detalhe-em-espera">
                  {atividade.emEspera}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-section" aria-labelledby="informacoes-title">
            <div className="section-heading">
              <span className="eyebrow">Informações gerais</span>
              <h3 id="informacoes-title">Sobre a atividade</h3>
            </div>

            <dl className="info-grid">
              <div>
                <dt>Sala</dt>
                <dd data-testid="detalhe-sala">
                  {getSalaNome(atividade.salaId)}
                </dd>
              </div>

              <div>
                <dt>Carga Horária</dt>
                <dd>
                  <span data-testid="detalhe-carga">
                    {atividade.cargaHorariaMinutos}
                  </span>{' '}
                  minutos
                </dd>
              </div>
            </dl>
          </section>

          <section className="detail-section" aria-labelledby="encontros-title">
            <div className="section-heading">
              <span className="eyebrow">Agenda</span>
              <h3 id="encontros-title">Encontros</h3>
            </div>

            {atividade.encontros && atividade.encontros.length > 0 ? (
              <ul className="encounter-list">
                {atividade.encontros.map((encontro, index) => (
                  <li key={encontro.id} className="encounter-card">
                    <span className="encounter-card__number" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <strong>Encontro {index + 1}</strong>
                      <p>
                        Início: {formatarDataHoraBrasilia(encontro.inicio)} | Fim:{' '}
                        {formatarDataHoraBrasilia(encontro.fim)}
                      </p>

                      <div className="encounter-actions" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {userPapel === 'organizacao' && (
                          <>
                            <Link
                              to={`/encontros/${encontro.id}/codigo`}
                              className="button button--secondary button--small"
                            >
                              Ver código de presença
                            </Link>
                            <Link
                              to={`/encontros/${encontro.id}/presenca-manual`}
                              className="button button--secondary button--small"
                            >
                              Registrar presença manual
                            </Link>
                          </>
                        )}
                        {userPapel === 'participante' && (
                          <Link
                            to={`/encontros/${encontro.id}/presenca`}
                            className="button button--primary button--small"
                          >
                            Registrar minha presença
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-inline">Nenhum encontro cadastrado.</p>
            )}
          </section>

          <M2ExtensionPoint
            atividade={atividade}
            selectedUserId={selectedUserId}
            userPapel={userPapel}
            apiClient={apiClient}
            onInscricaoUpdated={reload}
          />
        </article>
      )}
    </section>
  );
}