import React from 'react';
import { Link } from 'react-router-dom';
import { usePainelAtividades } from '../hooks/usePainelAtividades';
import { useDownloadFrequencia } from '../hooks/useDownloadFrequencia';
import { api } from '../api/client';

interface PainelOrganizacaoProps {
  selectedUserId: string;
  apiClient?: typeof api;
}

export function PainelOrganizacao({ selectedUserId, apiClient = api }: PainelOrganizacaoProps) {
  const { atividades, loading, error, atualizar } = usePainelAtividades(selectedUserId, apiClient);
  const {
    baixar,
    baixandoId,
    error: downloadError,
  } = useDownloadFrequencia(apiClient);

  if (loading) {
    return <div className="state-message" role="status">Carregando painel...</div>;
  }

  const formatPercent = (val: number | null) => {
    if (val === null) return 'Não disponível';
    return `${val.toFixed(1).replace('.', ',')}%`;
  };

  return (
    <section className="painel-organizacao m5-page" aria-labelledby="painel-title">
      <div className="m5-page__header">
        <div>
          <span className="eyebrow">Organização</span>
          <h2 id="painel-title">Painel da organização</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={atualizar}>
          Atualizar painel
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <strong>{error.erro}</strong>
          <span>{error.mensagem}</span>
        </div>
      )}

      {downloadError && (
        <div className="error-message" role="alert">
          <strong>{downloadError.erro}</strong>
          <span>{downloadError.mensagem}</span>
        </div>
      )}

      {!error && atividades.length === 0 && (
        <p className="empty-inline" role="status">Nenhuma atividade encontrada no painel.</p>
      )}

      {!error && atividades.length > 0 && (
        <div className="m5-table-wrapper">
        <table className="m5-table" aria-label="Atividades do painel">
          <thead>
            <tr>
              <th scope="col">Atividade</th>
              <th scope="col">Vagas</th>
              <th scope="col">Ocupadas</th>
              <th scope="col">Em espera</th>
              <th scope="col">Ocupação</th>
              <th scope="col">Frequência</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {atividades.map((atv) => (
              <tr key={atv.atividadeId}>
                <td>{atv.titulo}</td>
                <td>{atv.vagas}</td>
                <td>{atv.ocupadas}</td>
                <td>{atv.emEspera}</td>
                <td>{formatPercent(atv.ocupacaoPercentual)}</td>
                <td>{formatPercent(atv.frequenciaPercentual)}</td>
                <td className="m5-actions">
                  <Link
                    className="button button--ghost button--small"
                    to={`/painel/atividades/${atv.atividadeId}/sem-chance`}
                    aria-label={`Ver sem chance de certificado de ${atv.titulo}`}
                  >
                    Sem chance
                  </Link>
                  <button
                    className="button button--secondary button--small"
                    type="button"
                    aria-label={`Baixar frequência de ${atv.titulo}`}
                    disabled={baixandoId === atv.atividadeId}
                    onClick={() => baixar(atv.atividadeId)}
                  >
                    {baixandoId === atv.atividadeId ? 'Baixando...' : 'Baixar CSV'}
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
