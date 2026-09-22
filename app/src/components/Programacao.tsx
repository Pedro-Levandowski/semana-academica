import React from 'react';
import { Link } from 'react-router-dom';
import { Atividade, Sala } from '../api/types';
import { formatarHoraBrasilia } from '../utils/date';

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
  userPapel?: string;
}

const SITUACAO_LABELS: Record<Atividade['situacao'], string> = {
  prevista: 'Prevista',
  em_andamento: 'Em andamento',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

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
  userPapel,
}: ProgramacaoProps) {
  const getSalaNome = (salaId: string) => {
    const sala = salas.find((item) => item.id === salaId);
    return sala ? sala.nome : salaId;
  };

  return (
    <section className="programacao-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Agenda do evento</span>
          <h2>Programação</h2>
          <p>
            Navegue pelos dias e encontre palestras e minicursos da Semana Acadêmica.
          </p>
        </div>

        <div className="detail-actions">
          {userPapel === 'participante' && (
            <>
              <Link
                to="/certificados"
                className="button button--secondary meus-certificados-link"
              >
                Meus Certificados
              </Link>
              <Link
                to="/extrato"
                className="button button--secondary extrato-horas-link"
              >
                Extrato de Horas
              </Link>
            </>
          )}

          <Link
            to="/verificar"
            className="button button--ghost verificar-certificado-link"
          >
            Verificar certificado
          </Link>

          {userPapel === 'organizacao' && (
            <Link
              to="/atividades/nova"
              className="button button--primary criar-atividade-link"
            >
              Criar atividade
            </Link>
          )}
        </div>
      </div>

      <div className="schedule-toolbar">
        <nav className="day-tabs" aria-label="Dias da Semana Acadêmica">
          {dias.map((item) => {
            const isActive = dia === item.data;

            return (
              <button
                key={item.data}
                type="button"
                onClick={() => setDia(item.data)}
                className={`day-tab ${isActive ? 'active-day' : ''}`}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="tipo-filtro">
          <label htmlFor="tipo-select">Filtrar por tipo:</label>

          <select
            id="tipo-select"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="palestra">Palestra</option>
            <option value="minicurso">Minicurso</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="state-message state-message--loading" role="status" aria-live="polite">
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando programação...</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível carregar a programação.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loading && !error && atividades.length === 0 && (
        <div className="empty-message" role="status" aria-live="polite">
          <div className="empty-message__icon" aria-hidden="true">
            0
          </div>
          <strong>Nenhuma atividade encontrada</strong>
          <p>Não há atividades para os filtros selecionados.</p>
        </div>
      )}

      {!loading && !error && atividades.length > 0 && (
        <ul className="atividades-list">
          {atividades.map((atividade) => {
            const isCancelada = atividade.situacao === 'cancelada';
            const primeiroEncontro = atividade.encontros?.[0];

            return (
              <li
                key={atividade.id}
                className={`atividade-item ${
                  isCancelada ? 'atividade-cancelada' : ''
                }`}
              >
                <article className="activity-card">
                  <div className="activity-card__topline">
                    <span className="type-badge">{atividade.tipo}</span>

                    <span
                      className={`status-badge status-badge--${atividade.situacao}`}
                    >
                      {SITUACAO_LABELS[atividade.situacao]}
                    </span>
                  </div>

                  <div className="activity-card__title-row">
                    <div>
                      <h3>{atividade.titulo}</h3>

                      {isCancelada && (
                        <span className="cancelled-marker">(Cancelada)</span>
                      )}
                    </div>

                    {primeiroEncontro && (
                      <span className="activity-card__time">
                        {formatarHoraBrasilia(primeiroEncontro.inicio)}
                      </span>
                    )}
                  </div>

                  <dl className="activity-card__metadata">
                    <div>
                      <dt>Sala</dt>
                      <dd>{getSalaNome(atividade.salaId)}</dd>
                    </div>

                    <div>
                      <dt>Vagas</dt>
                      <dd>
                        {atividade.vagas} (Restantes: {atividade.vagasRestantes})
                      </dd>
                    </div>

                    <div>
                      <dt>Situação</dt>
                      <dd>{atividade.situacao}</dd>
                    </div>
                  </dl>

                  <footer className="activity-card__footer">
                    <Link
                      to={`/atividades/${atividade.id}`}
                      className="button button--secondary ver-detalhes-link"
                    >
                      Ver detalhes
                    </Link>
                  </footer>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}