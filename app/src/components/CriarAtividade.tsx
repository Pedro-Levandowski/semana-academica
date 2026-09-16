import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sala } from '../api/types';
import { api } from '../api/client';

interface CriarAtividadeProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function CriarAtividade({
  selectedUserId,
  userPapel,
  apiClient = api,
}: CriarAtividadeProps) {
  const navigate = useNavigate();

  const [salas, setSalas] = useState<Sala[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [salasError, setSalasError] = useState<{
    erro: string;
    mensagem: string;
  } | null>(null);

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'palestra' | 'minicurso'>('palestra');
  const [salaId, setSalaId] = useState('');
  const [vagas, setVagas] = useState(10);
  const [encontros, setEncontros] = useState<
    Array<{ inicio: string; fim: string }>
  >([{ inicio: '', fim: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{
    erro: string;
    mensagem: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUserId) {
      setLoadingSalas(false);
      return;
    }

    setLoadingSalas(true);
    setSalasError(null);

    apiClient
      .getSalas()
      .then((response) => {
        setSalas(response);

        if (response.length > 0 && !salaId) {
          setSalaId(response[0].id);
        }

        setLoadingSalas(false);
      })
      .catch((err: any) => {
        setSalasError({
          erro: err.erro || 'ERRO_DESCONHECIDO',
          mensagem: err.mensagem || err.message || 'Erro ao carregar salas',
        });
        setLoadingSalas(false);
      });
  }, [selectedUserId, apiClient]);

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

  const handleAddEncontro = () => {
    setEncontros([...encontros, { inicio: '', fim: '' }]);
  };

  const handleRemoveEncontro = (index: number) => {
    if (encontros.length > 1) {
      setEncontros(encontros.filter((_, itemIndex) => itemIndex !== index));
    }
  };

  const handleEncontroChange = (
    index: number,
    field: 'inicio' | 'fim',
    value: string,
  ) => {
    const updated = [...encontros];
    updated[index][field] = value;
    setEncontros(updated);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submitting || loadingSalas || salasError) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formattedEncontros = encontros.map((encontro) => ({
      inicio: encontro.inicio ? `${encontro.inicio}:00-03:00` : '',
      fim: encontro.fim ? `${encontro.fim}:00-03:00` : '',
    }));

    try {
      const novaAtividade = await apiClient.createAtividade({
        titulo,
        tipo,
        salaId: salaId || (salas[0]?.id ?? ''),
        vagas: Number(vagas),
        encontros: formattedEncontros,
      });

      setSuccessMessage('Atividade criada com sucesso!');

      setTimeout(() => {
        navigate(`/atividades/${novaAtividade.id}`);
      }, 100);
    } catch (err: any) {
      setError({
        erro: err.erro || 'ERRO_DESCONHECIDO',
        mensagem: err.mensagem || err.message || 'Erro ao criar atividade',
      });
      setSubmitting(false);
    }
  };

  return (
    <section className="form-page criar-atividade-container">
      <Link to="/" className="back-link">
        Voltar para a programação
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">Nova atividade</span>
          <h2>Criar Atividade</h2>
          <p>
            Cadastre uma palestra ou minicurso na programação da Semana Acadêmica.
          </p>
        </div>
      </div>

      {loadingSalas && (
        <div className="state-message state-message--loading" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando salas...</span>
        </div>
      )}

      {salasError && (
        <div className="error-message" role="alert">
          <strong>Não foi possível carregar as salas.</strong>
          <span>
            Erro ({salasError.erro}): {salasError.mensagem}
          </span>
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível criar a atividade.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loadingSalas && !salasError && (
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-card__header">
            <span className="form-card__step">01</span>
            <div>
              <h3>Informações principais</h3>
              <p>Defina os dados básicos da atividade.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field field--wide">
              <label htmlFor="titulo-input">Título:</label>
              <input
                id="titulo-input"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ex.: Desenvolvimento web moderno"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="tipo-select">Tipo:</label>
              <select
                id="tipo-select"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as 'palestra' | 'minicurso')
                }
              >
                <option value="palestra">Palestra</option>
                <option value="minicurso">Minicurso</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="sala-select">Sala:</label>
              <select
                id="sala-select"
                value={salaId}
                onChange={(event) => setSalaId(event.target.value)}
              >
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} (Capacidade: {sala.capacidade})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="vagas-input">Vagas:</label>
              <input
                id="vagas-input"
                type="number"
                value={vagas}
                onChange={(event) => setVagas(Number(event.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <fieldset className="encounters-fieldset">
            <legend>Encontros</legend>

            <div className="encounters-fieldset__heading">
              <div>
                <h3>Agenda da atividade</h3>
                <p>Adicione as datas e horários de cada encontro.</p>
              </div>

              <button
                type="button"
                onClick={handleAddEncontro}
                className="button button--secondary button--small"
              >
                Adicionar Encontro
              </button>
            </div>

            <div className="encounter-editor-list">
              {encontros.map((encontro, index) => (
                <div key={index} className="encounter-editor">
                  <div className="encounter-editor__header">
                    <span>Encontro {index + 1}</span>

                    {encontros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEncontro(index)}
                        className="button button--text-danger button--small"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="encounter-editor__fields">
                    <div className="field">
                      <label htmlFor={`encontro-inicio-${index}`}>Início:</label>
                      <input
                        id={`encontro-inicio-${index}`}
                        type="datetime-local"
                        value={encontro.inicio}
                        onChange={(event) =>
                          handleEncontroChange(
                            index,
                            'inicio',
                            event.target.value,
                          )
                        }
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor={`encontro-fim-${index}`}>Fim:</label>
                      <input
                        id={`encontro-fim-${index}`}
                        type="datetime-local"
                        value={encontro.fim}
                        onChange={(event) =>
                          handleEncontroChange(index, 'fim', event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="form-actions">
            <Link to="/" className="button button--ghost">
              Voltar sem salvar
            </Link>

            <button
              type="submit"
              disabled={submitting || loadingSalas || !!salasError}
              className="button button--primary"
            >
              {submitting ? 'Criando atividade...' : 'Salvar Atividade'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}