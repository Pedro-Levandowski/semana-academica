import React from 'react';
import { Atividade, Sala } from '../api/types';

interface ProgramacaoProps {
  dia: string;
  setDia: (dia: string) => void;
  tipo: string;
  setTipo: (tipo: string) => void;
  atividades: Atividade[];
  salas: Sala[];
  loading: boolean;
  error: { erro: string; mensagem: string } | null;
  dias: Array<{ data: string; label: string }>;
}

export function Programacao({
  dia,
  setDia,
  tipo,
  setTipo,
  atividades,
  salas,
  loading,
  error,
  dias,
}: ProgramacaoProps) {
  const getSalaNome = (salaId: string) => {
    const sala = salas.find((s) => s.id === salaId);
    return sala ? sala.nome : salaId;
  };

  const formatarHorario = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="programacao-container" style={{ marginTop: '2rem' }}>
      <h2>Programação</h2>

      <div className="filtros-container" style={{ margin: '1rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="dias-navegacao" style={{ display: 'flex', gap: '0.5rem' }}>
          {dias.map((d) => (
            <button
              key={d.data}
              type="button"
              onClick={() => setDia(d.data)}
              className={dia === d.data ? 'active-day' : ''}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: dia === d.data ? '#007bff' : '#f8f9fa',
                color: dia === d.data ? '#fff' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="tipo-filtro" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="tipo-select">Filtrar por tipo:</label>
          <select
            id="tipo-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Todos os tipos</option>
            <option value="palestra">Palestra</option>
            <option value="minicurso">Minicurso</option>
          </select>
        </div>
      </div>

      {loading && <p>Carregando programação...</p>}

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '1rem 0' }}>
          Erro ({error.erro}): {error.mensagem}
        </div>
      )}

      {!loading && !error && atividades.length === 0 && (
        <p className="empty-message">Nenhuma atividade encontrada para os filtros selecionados.</p>
      )}

      {!loading && !error && atividades.length > 0 && (
        <ul className="atividades-list" style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
          {atividades.map((atv) => {
            const isCancelada = atv.situacao === 'cancelada';
            const primeiroEncontro = atv.encontros?.[0];
            return (
              <li
                key={atv.id}
                className={`atividade-item ${isCancelada ? 'atividade-cancelada' : ''}`}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: isCancelada ? '#fff5f5' : '#fff',
                  opacity: isCancelada ? 0.8 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', textDecoration: isCancelada ? 'line-through' : 'none' }}>
                      {atv.titulo} {isCancelada && <span style={{ color: 'red', fontSize: '0.8rem', textDecoration: 'none' }}>(Cancelada)</span>}
                    </h3>
                    <p style={{ margin: '0.2rem 0' }}>
                      <strong>Tipo:</strong> {atv.tipo}
                    </p>
                    <p style={{ margin: '0.2rem 0' }}>
                      <strong>Sala:</strong> {getSalaNome(atv.salaId)}
                    </p>
                    {primeiroEncontro && (
                      <p style={{ margin: '0.2rem 0' }}>
                        <strong>Início:</strong> {formatarHorario(primeiroEncontro.inicio)}
                      </p>
                    )}
                    <p style={{ margin: '0.2rem 0' }}>
                      <strong>Vagas:</strong> {atv.vagas} (Restantes: {atv.vagasRestantes})
                    </p>
                    <p style={{ margin: '0.2rem 0' }}>
                      <strong>Situação:</strong> {atv.situacao}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
