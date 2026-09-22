import React from 'react';
import { api } from '../api/client';
import { useBloqueios } from '../hooks/useBloqueios';

interface BloqueiosPainelProps {
  selectedUserId: string;
  apiClient?: typeof api;
}

export function BloqueiosPainel({ selectedUserId, apiClient = api }: BloqueiosPainelProps) {
  const {
    bloqueios,
    loading,
    error,
    actionError,
    removendoId,
    atualizar,
    desbloquear,
  } = useBloqueios(selectedUserId, apiClient);

  if (loading) {
    return <div className="state-message" role="status">Carregando bloqueios...</div>;
  }

  return (
    <section className="m5-page" aria-labelledby="bloqueios-title">
      <div className="m5-page__header">
        <div>
          <span className="eyebrow">Organização</span>
          <h2 id="bloqueios-title">Participantes bloqueados</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={atualizar}>
          Atualizar bloqueios
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>{error.erro}</strong>
          <span>{error.mensagem}</span>
        </div>
      )}

      {actionError && (
        <div className="error-message" role="alert">
          <strong>{actionError.erro}</strong>
          <span>{actionError.mensagem}</span>
        </div>
      )}

      {!error && bloqueios.length === 0 && (
        <p className="empty-inline" role="status">Nenhum participante bloqueado.</p>
      )}

      {!error && bloqueios.length > 0 && (
        <div className="m5-table-wrapper">
          <table className="m5-table" aria-label="Participantes bloqueados">
            <thead>
              <tr>
                <th scope="col">Participante</th>
                <th scope="col">Atividades causadoras</th>
                <th scope="col">Bloqueado desde</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {bloqueios.map((item) => (
                <tr key={item.participanteId}>
                  <td>{item.nome}</td>
                  <td>{item.atividades.join(', ')}</td>
                  <td>{item.bloqueadoDesde}</td>
                  <td>
                    <button
                      className="button button--danger button--small"
                      type="button"
                      aria-label={`Desbloquear ${item.nome}`}
                      disabled={removendoId === item.participanteId}
                      onClick={() => desbloquear(item.participanteId)}
                    >
                      {removendoId === item.participanteId ? 'Desbloqueando...' : 'Desbloquear'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
