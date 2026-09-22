import React from 'react';
import { useParams } from 'react-router-dom';
import { useSemChance } from '../hooks/useSemChance';
import { api } from '../api/client';

interface SemChanceRelatorioProps {
  selectedUserId: string;
  apiClient?: typeof api;
}

export function SemChanceRelatorio({ selectedUserId, apiClient = api }: SemChanceRelatorioProps) {
  const { id } = useParams<{ id: string }>();
  const { participantes, loading, error, atualizar } = useSemChance(id, selectedUserId, apiClient);

  if (loading) {
    return <div className="state-message" role="status">Carregando relatório...</div>;
  }

  return (
    <section className="sem-chance-relatorio m5-page" aria-labelledby="sem-chance-title">
      <div className="m5-page__header">
        <div>
          <span className="eyebrow">Relatório</span>
          <h2 id="sem-chance-title">Participantes sem chance de certificado</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={atualizar}>
          Atualizar relatório
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>{error.erro}</strong>
          <span>{error.mensagem}</span>
        </div>
      )}

      {!error && participantes.length === 0 && (
        <p className="empty-inline" role="status">Nenhum participante sem chance de certificado.</p>
      )}

      {!error && participantes.length > 0 && (
        <div className="m5-table-wrapper">
        <table className="m5-table" aria-label="Participantes sem chance">
          <thead>
            <tr>
              <th scope="col">Participante</th>
              <th scope="col">Faltas</th>
              <th scope="col">Faltas permitidas</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((p) => (
              <tr key={p.participanteId}>
                <td>{p.nome}</td>
                <td>{p.faltas}</td>
                <td>{p.faltasPermitidas}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}
