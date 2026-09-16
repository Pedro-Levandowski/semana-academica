import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAtividadeDetalhe } from '../hooks/useAtividadeDetalhe';
import { M2ExtensionPoint } from './M2ExtensionPoint';
import { api } from '../api/client';

interface AtividadeDetalheProps {
  selectedUserId: string | null;
  apiClient?: typeof api;
}

export function AtividadeDetalhe({ selectedUserId, apiClient = api }: AtividadeDetalheProps) {
  const { id } = useParams<{ id: string }>();
  const { atividade, salas, loading, error } = useAtividadeDetalhe(id, selectedUserId, apiClient);

  const getSalaNome = (salaId: string) => {
    const sala = salas.find((s) => s.id === salaId);
    return sala ? sala.nome : salaId;
  };

  const formatarDataHora = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  if (!selectedUserId) {
    return (
      <div>
        <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
        <p>
          <Link to="/">Voltar para a programação</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="atividade-detalhe-container" style={{ padding: '1rem 0' }}>
      <p>
        <Link to="/" className="voltar-link">Voltar para a programação</Link>
      </p>

      {loading && <p>Carregando atividade...</p>}

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '1rem 0' }}>
          Erro ({error.erro}): {error.mensagem}
        </div>
      )}

      {!loading && !error && atividade && (
        <div>
          {atividade.situacao === 'cancelada' && (
            <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '1rem' }}>
              Atividade Cancelada
            </div>
          )}

          <h2 data-testid="detalhe-titulo">{atividade.titulo}</h2>
          <p><strong>Tipo:</strong> <span data-testid="detalhe-tipo">{atividade.tipo}</span></p>
          <p><strong>Sala:</strong> <span data-testid="detalhe-sala">{getSalaNome(atividade.salaId)}</span></p>
          <p><strong>Vagas:</strong> <span data-testid="detalhe-vagas">{atividade.vagas}</span></p>
          <p><strong>Carga Horária:</strong> <span data-testid="detalhe-carga">{atividade.cargaHorariaMinutos}</span> minutos</p>
          <p><strong>Situação:</strong> <span data-testid="detalhe-situacao">{atividade.situacao}</span></p>
          <p><strong>Ocupadas:</strong> <span data-testid="detalhe-ocupadas">{atividade.ocupadas}</span></p>
          <p><strong>Vagas Restantes:</strong> <span data-testid="detalhe-vagas-restantes">{atividade.vagasRestantes}</span></p>
          <p><strong>Pessoas em Espera:</strong> <span data-testid="detalhe-em-espera">{atividade.emEspera}</span></p>

          <h3>Encontros</h3>
          {atividade.encontros && atividade.encontros.length > 0 ? (
            <ul>
              {atividade.encontros.map((enc) => (
                <li key={enc.id}>
                  Início: {formatarDataHora(enc.inicio)} | Fim: {formatarDataHora(enc.fim)}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum encontro cadastrado.</p>
          )}

          <M2ExtensionPoint />
        </div>
      )}
    </div>
  );
}
