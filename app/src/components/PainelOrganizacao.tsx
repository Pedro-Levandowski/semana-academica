import React from 'react';
import { usePainelAtividades } from '../hooks/usePainelAtividades';
import { api } from '../api/client';

interface PainelOrganizacaoProps {
  selectedUserId: string;
  apiClient?: typeof api;
}

export function PainelOrganizacao({ selectedUserId, apiClient = api }: PainelOrganizacaoProps) {
  const { atividades, loading, error, atualizar } = usePainelAtividades(selectedUserId, apiClient);

  if (loading) {
    return <div role="status">Carregando painel...</div>;
  }

  const formatPercent = (val: number | null) => {
    if (val === null) return 'Não disponível';
    return `${val.toFixed(1).replace('.', ',')}%`;
  };

  return (
    <div className="painel-organizacao">
      <h2>Painel da organização</h2>

      <button type="button" onClick={atualizar}>
        Atualizar painel
      </button>

      {error && (
        <div role="alert">
          <strong>{error.erro}</strong>: {error.mensagem}
        </div>
      )}

      {!error && atividades.length === 0 && (
        <p role="status">Nenhuma atividade encontrada no painel.</p>
      )}

      {!error && atividades.length > 0 && (
        <table aria-label="Atividades do painel">
          <thead>
            <tr>
              <th scope="col">Atividade</th>
              <th scope="col">Vagas</th>
              <th scope="col">Ocupadas</th>
              <th scope="col">Em espera</th>
              <th scope="col">Ocupação</th>
              <th scope="col">Frequência</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
