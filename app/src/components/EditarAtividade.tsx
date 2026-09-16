import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Atividade, Sala } from '../api/types';
import { api } from '../api/client';

interface EditarAtividadeProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function EditarAtividade({
  selectedUserId,
  userPapel,
  apiClient = api,
}: EditarAtividadeProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [titulo, setTitulo] = useState('');
  const [vagas, setVagas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{
    erro: string;
    mensagem: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !selectedUserId || userPapel !== 'organizacao') return;

    setLoading(true);

    Promise.all([apiClient.getSalas(), apiClient.getAtividade(id)])
      .then(([salasResponse, atividadeResponse]) => {
        setSalas(salasResponse);
        setAtividade(atividadeResponse);
        setTitulo(atividadeResponse.titulo);
        setVagas(atividadeResponse.vagas);
        setLoading(false);
      })
      .catch((err: any) => {
        setError({
          erro: err.erro || 'ERRO_DESCONHECIDO',
          mensagem:
            err.mensagem || err.message || 'Erro ao carregar atividade',
        });
        setLoading(false);
      });
  }, [id, selectedUserId, userPapel, apiClient]);

  if (!selectedUserId || userPapel !== 'organizacao') {
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

  const getSalaNome = (salaId: string) => {
    const sala = salas.find((item) => item.id === salaId);
    return sala ? sala.nome : salaId;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submitting || !id) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.updateAtividade(id, {
        titulo,
        vagas: Number(vagas),
      });

      setSuccessMessage('Atividade alterada com sucesso!');

      setTimeout(() => {
        navigate(`/atividades/${id}`);
      }, 100);
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao editar atividade',
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-message state-message--loading" role="status" aria-live="polite">
        <span className="loading-indicator" aria-hidden="true" />
        <span>Carregando atividade...</span>
      </div>
    );
  }

  return (
    <section className="form-page editar-atividade-container">
      <Link to={`/atividades/${id}`} className="back-link voltar-detalhe-link">
        Voltar ao detalhe
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">Gerenciamento</span>
          <h2>Editar Atividade</h2>
          <p>Atualize o título ou a quantidade de vagas disponíveis.</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-message" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível salvar as alterações.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {atividade && (
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-card__header">
            <span className="form-card__step">01</span>

            <div>
              <h3>Campos editáveis</h3>
              <p>Somente título e vagas podem ser modificados.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field field--wide">
              <label htmlFor="edit-titulo-input">Título:</label>
              <input
                id="edit-titulo-input"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="edit-vagas-input">Vagas:</label>
              <input
                id="edit-vagas-input"
                type="number"
                value={vagas}
                onChange={(event) => setVagas(Number(event.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <section className="readonly-panel" aria-labelledby="readonly-title">
            <div className="readonly-panel__heading">
              <span className="form-card__step">02</span>

              <div>
                <h3 id="readonly-title">Informações fixas</h3>
                <p>Estes dados não podem ser alterados depois da criação.</p>
              </div>
            </div>

            <dl className="info-grid">
              <div>
                <dt>Tipo (Não editável)</dt>
                <dd>{atividade.tipo}</dd>
              </div>

              <div>
                <dt>Sala (Não editável)</dt>
                <dd>{getSalaNome(atividade.salaId)}</dd>
              </div>

              <div>
                <dt>Carga Horária (Não editável)</dt>
                <dd>{atividade.cargaHorariaMinutos} minutos</dd>
              </div>
            </dl>
          </section>

          <div className="form-actions">
            <Link
              to={`/atividades/${id}`}
              className="button button--ghost voltar-sem-salvar"
            >
              Voltar sem salvar
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="button button--primary"
            >
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}