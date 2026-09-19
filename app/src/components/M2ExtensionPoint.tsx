import React, { useState, useEffect } from 'react';
import { Atividade, Inscricao } from '../api/types';
import { api } from '../api/client';

interface M2ExtensionPointProps {
  atividade?: Atividade | null;
  selectedUserId?: string | null;
  userPapel?: string;
  apiClient?: typeof api;
  onInscricaoUpdated?: () => void;
}

export function formatRemainingTime(convocadaAte: string, nowMs: number): string {
  const targetMs = new Date(convocadaAte).getTime();
  const diffMs = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function M2ExtensionPoint({
  atividade,
  selectedUserId,
  userPapel,
  apiClient = api,
  onInscricaoUpdated,
}: M2ExtensionPointProps) {
  const [inscricoesAtividade, setInscricoesAtividade] = useState<Inscricao[]>([]);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      if (userPapel === 'participante') {
        const userInscricoes = await apiClient.getInscricoes();
        setMinhasInscricoes(userInscricoes);
        if (atividade) {
          const atvInscs = userInscricoes.filter((i) => i.atividadeId === atividade.id);
          setInscricoesAtividade(atvInscs);
        }
      } else if (userPapel === 'organizacao') {
        if (atividade) {
          const atvInscs = await apiClient.getInscricoes({ atividadeId: atividade.id });
          setInscricoesAtividade(atvInscs);
        } else {
          const allInscs = await apiClient.getInscricoes();
          setMinhasInscricoes(allInscs);
        }
      }
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao carregar inscrições',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [atividade?.id, selectedUserId, userPapel]);

  const activeInscricaoAtividade = inscricoesAtividade.find(
    (i) => i.status === 'confirmada' || i.status === 'em_espera' || i.status === 'convocada'
  );

  const handleInscrever = async () => {
    if (!atividade || actionLoading) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const nova = await apiClient.createInscricao(atividade.id);
      setSuccessMessage('Inscrição realizada com sucesso!');
      await loadData();
      onInscricaoUpdated?.();
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao realizar inscrição',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmar = async (inscricaoId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.confirmInscricao(inscricaoId);
      setSuccessMessage('Convocação confirmada com sucesso!');
      await loadData();
      onInscricaoUpdated?.();
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao confirmar convocação',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async (inscricaoId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.cancelInscricao(inscricaoId);
      setSuccessMessage('Inscrição cancelada com sucesso!');
      await loadData();
      onInscricaoUpdated?.();
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao cancelar inscrição',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!selectedUserId) return null;

  return (
    <div className="m2-extension-container" data-testid="m2-extension">
      {error && (
        <div className="error-message" role="alert">
          <strong>Erro ({error.erro}):</strong> {error.mensagem}
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {userPapel === 'participante' && atividade && (
        <section className="detail-section" aria-labelledby="inscricao-acao-title">
          <div className="section-heading">
            <span className="eyebrow">Sua Inscrição</span>
            <h3 id="inscricao-acao-title">Status e Ações da Inscrição</h3>
          </div>

          {loading ? (
            <div className="state-message state-message--loading" role="status" aria-live="polite">
              <span>Carregando inscrição...</span>
            </div>
          ) : !activeInscricaoAtividade ? (
            atividade.situacao !== 'cancelada' && (
              <div className="inscricao-acoes">
                <button
                  type="button"
                  onClick={handleInscrever}
                  disabled={actionLoading}
                  className="button button--primary"
                >
                  {actionLoading ? 'Inscrevendo...' : 'Inscrever-se'}
                </button>
              </div>
            )
          ) : (
            <div className="inscricao-status-card">
              <div className="status-badge-container">
                <span className={`status-badge status-badge--${activeInscricaoAtividade.status}`}>
                  {activeInscricaoAtividade.status}
                </span>

                {activeInscricaoAtividade.status === 'em_espera' && (
                  <span className="posicao-espera">
                    Posição na fila: <strong>{activeInscricaoAtividade.posicaoNaEspera}</strong>
                  </span>
                )}

                {activeInscricaoAtividade.status === 'convocada' && activeInscricaoAtividade.convocadaAte && (
                  <div className="convocacao-timer" role="timer" aria-live="off">
                    <span>Tempo restante para confirmar: </span>
                    <strong data-testid="countdown-timer">
                      {formatRemainingTime(activeInscricaoAtividade.convocadaAte, now)}
                    </strong>
                  </div>
                )}
              </div>

              <div className="inscricao-botoes">
                {activeInscricaoAtividade.status === 'convocada' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmar(activeInscricaoAtividade.id)}
                    disabled={actionLoading}
                    className="button button--primary"
                  >
                    {actionLoading ? 'Confirmando...' : 'Confirmar Vaga'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCancelar(activeInscricaoAtividade.id)}
                  disabled={actionLoading}
                  className="button button--danger"
                >
                  {actionLoading ? 'Cancelando...' : 'Cancelar Inscrição'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {userPapel === 'participante' && (
        <section className="detail-section" aria-labelledby="minhas-inscricoes-title">
          <div className="section-heading">
            <span className="eyebrow">Histórico</span>
            <h3 id="minhas-inscricoes-title">Minhas Inscrições</h3>
          </div>

          {minhasInscricoes.length === 0 ? (
            <p className="empty-inline">Você não possui inscrições registradas.</p>
          ) : (
            <ul className="minhas-inscricoes-list">
              {minhasInscricoes.map((insc) => (
                <li key={insc.id} className="minhas-inscricoes-item">
                  <div className="insc-info">
                    <strong>Inscrição {insc.id}</strong>
                    <span>Atividade: {insc.atividadeId}</span>
                    <span className={`status-badge status-badge--${insc.status}`}>
                      {insc.status}
                    </span>
                    {insc.status === 'em_espera' && (
                      <span> (Fila: {insc.posicaoNaEspera})</span>
                    )}
                    {insc.status === 'convocada' && insc.convocadaAte && (
                      <span className="convocacao-timer">
                        Expira em: {formatRemainingTime(insc.convocadaAte, now)}
                      </span>
                    )}
                  </div>

                  <div className="insc-actions">
                    {insc.status === 'convocada' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmar(insc.id)}
                        disabled={actionLoading}
                        className="button button--primary"
                      >
                        Confirmar Vaga
                      </button>
                    )}
                    {(insc.status === 'confirmada' || insc.status === 'em_espera' || insc.status === 'convocada') && (
                      <button
                        type="button"
                        onClick={() => handleCancelar(insc.id)}
                        disabled={actionLoading}
                        className="button button--danger"
                      >
                        Cancelar Inscrição
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {userPapel === 'organizacao' && atividade && (
        <section className="detail-section" aria-labelledby="inscritos-espera-title">
          <div className="section-heading">
            <span className="eyebrow">Gestão</span>
            <h3 id="inscritos-espera-title">Inscritos e Fila de Espera</h3>
          </div>

          {loading ? (
            <div className="state-message state-message--loading" role="status" aria-live="polite">
              <span>Carregando lista de inscritos...</span>
            </div>
          ) : inscricoesAtividade.length === 0 ? (
            <p className="empty-inline">Nenhum inscrito nesta atividade.</p>
          ) : (
            <ul className="inscritos-list">
              {inscricoesAtividade.map((i) => (
                <li key={i.id} className="inscrito-item">
                  <span>Participante: {i.participanteId}</span>
                  <span className={`status-badge status-badge--${i.status}`}>{i.status}</span>
                  {i.posicaoNaEspera !== null && (
                    <span> (Posição: {i.posicaoNaEspera})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

