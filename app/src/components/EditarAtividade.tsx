import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Atividade, Sala } from '../api/types';
import { api } from '../api/client';

interface EditarAtividadeProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function EditarAtividade({ selectedUserId, userPapel, apiClient = api }: EditarAtividadeProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [titulo, setTitulo] = useState('');
  const [vagas, setVagas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ erro: string; mensagem: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !selectedUserId || userPapel !== 'organizacao') return;
    setLoading(true);
    Promise.all([
      apiClient.getSalas(),
      apiClient.getAtividade(id),
    ])
      .then(([salasRes, atvRes]) => {
        setSalas(salasRes);
        setAtividade(atvRes);
        setTitulo(atvRes.titulo);
        setVagas(atvRes.vagas);
        setLoading(false);
      })
      .catch((err: any) => {
        setError({
          erro: err.erro || 'ERRO_DESCONHECIDO',
          mensagem: err.mensagem || err.message || 'Erro ao carregar atividade',
        });
        setLoading(false);
      });
  }, [id, selectedUserId, userPapel, apiClient]);

  if (!selectedUserId || userPapel !== 'organizacao') {
    return (
      <div>
        <p>Acesso negado ou usuário não autorizado.</p>
        <Link to="/">Voltar para a programação</Link>
      </div>
    );
  }

  const getSalaNome = (salaId: string) => {
    const sala = salas.find((s) => s.id === salaId);
    return sala ? sala.nome : salaId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    return <p>Carregando atividade...</p>;
  }

  return (
    <div className="editar-atividade-container" style={{ padding: '1rem 0' }}>
      <p>
        <Link to={`/atividades/${id}`} className="voltar-detalhe-link">Voltar ao detalhe</Link>
      </p>

      <h2>Editar Atividade</h2>

      {successMessage && <div className="success-message" style={{ color: 'green' }}>{successMessage}</div>}

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '1rem 0' }}>
          Erro ({error.erro}): {error.mensagem}
        </div>
      )}

      {atividade && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
          <div>
            <label htmlFor="edit-titulo-input">Título:</label>
            <input
              id="edit-titulo-input"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div>
            <label htmlFor="edit-vagas-input">Vagas:</label>
            <input
              id="edit-vagas-input"
              type="number"
              value={vagas}
              onChange={(e) => setVagas(Number(e.target.value))}
              min={1}
              required
              style={{ display: 'block', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
            <p><strong>Tipo (Não editável):</strong> <span>{atividade.tipo}</span></p>
            <p><strong>Sala (Não editável):</strong> <span>{getSalaNome(atividade.salaId)}</span></p>
            <p><strong>Carga Horária (Não editável):</strong> <span>{atividade.cargaHorariaMinutos} minutos</span></p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: submitting ? '#cccccc' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <Link
              to={`/atividades/${id}`}
              className="voltar-sem-salvar"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Voltar sem salvar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
