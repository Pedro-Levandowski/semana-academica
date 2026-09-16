import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sala } from '../api/types';
import { api } from '../api/client';

interface CriarAtividadeProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function CriarAtividade({ selectedUserId, userPapel, apiClient = api }: CriarAtividadeProps) {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [salasError, setSalasError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'palestra' | 'minicurso'>('palestra');
  const [salaId, setSalaId] = useState('');
  const [vagas, setVagas] = useState(10);
  const [encontros, setEncontros] = useState<Array<{ inicio: string; fim: string }>>([
    { inicio: '', fim: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUserId) {
      setLoadingSalas(false);
      return;
    }
    setLoadingSalas(true);
    setSalasError(null);
    apiClient.getSalas()
      .then((res) => {
        setSalas(res);
        if (res.length > 0 && !salaId) {
          setSalaId(res[0].id);
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
      <div>
        <p>Acesso negado ou usuário não autorizado.</p>
        <Link to="/">Voltar para a programação</Link>
      </div>
    );
  }

  const handleAddEncontro = () => {
    setEncontros([...encontros, { inicio: '', fim: '' }]);
  };

  const handleRemoveEncontro = (index: number) => {
    if (encontros.length > 1) {
      setEncontros(encontros.filter((_, i) => i !== index));
    }
  };

  const handleEncontroChange = (index: number, field: 'inicio' | 'fim', value: string) => {
    const updated = [...encontros];
    updated[index][field] = value;
    setEncontros(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || loadingSalas || salasError) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formattedEncontros = encontros.map((enc) => ({
      inicio: enc.inicio ? `${enc.inicio}:00-03:00` : '',
      fim: enc.fim ? `${enc.fim}:00-03:00` : '',
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
    <div className="criar-atividade-container" style={{ padding: '1rem 0' }}>
      <p>
        <Link to="/">Voltar para a programação</Link>
      </p>

      <h2>Criar Atividade</h2>

      {loadingSalas && <p role="status" aria-live="polite">Carregando salas...</p>}

      {salasError && (
        <div className="error-message" role="alert">
          Erro ({salasError.erro}): {salasError.mensagem}
        </div>
      )}

      {successMessage && <div className="success-message" role="status" aria-live="polite">{successMessage}</div>}

      {error && (
        <div className="error-message" role="alert">
          Erro ({error.erro}): {error.mensagem}
        </div>
      )}

      {!loadingSalas && !salasError && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
          <div>
            <label htmlFor="titulo-input">Título:</label>
            <input
              id="titulo-input"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div>
            <label htmlFor="tipo-select">Tipo:</label>
            <select
              id="tipo-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'palestra' | 'minicurso')}
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            >
              <option value="palestra">Palestra</option>
              <option value="minicurso">Minicurso</option>
            </select>
          </div>

          <div>
            <label htmlFor="sala-select">Sala:</label>
            <select
              id="sala-select"
              value={salaId}
              onChange={(e) => setSalaId(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            >
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nome} (Capacidade: {sala.capacidade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vagas-input">Vagas:</label>
            <input
              id="vagas-input"
              type="number"
              value={vagas}
              onChange={(e) => setVagas(Number(e.target.value))}
              min={1}
              required
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <fieldset style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
            <legend>Encontros</legend>
            {encontros.map((enc, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <div>
                  <label htmlFor={`encontro-inicio-${index}`}>Início:</label>
                  <input
                    id={`encontro-inicio-${index}`}
                    type="datetime-local"
                    value={enc.inicio}
                    onChange={(e) => handleEncontroChange(index, 'inicio', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`encontro-fim-${index}`}>Fim:</label>
                  <input
                    id={`encontro-fim-${index}`}
                    type="datetime-local"
                    value={enc.fim}
                    onChange={(e) => handleEncontroChange(index, 'fim', e.target.value)}
                    required
                  />
                </div>
                {encontros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEncontro(index)}
                    style={{ alignSelf: 'flex-end', padding: '0.4rem' }}
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddEncontro} style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem' }}>
              Adicionar Encontro
            </button>
          </fieldset>

          <button
            type="submit"
            disabled={submitting || loadingSalas || !!salasError}
            style={{
              padding: '0.75rem',
              backgroundColor: submitting || loadingSalas || !!salasError ? '#cccccc' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting || loadingSalas || !!salasError ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Criando atividade...' : 'Salvar Atividade'}
          </button>
        </form>
      )}
    </div>
  );
}
