import React from 'react';
import { Link } from 'react-router-dom';
import { useRegistrarPresenca } from '../hooks/useRegistrarPresenca';
import { api } from '../api/client';

interface RegistrarPresencaProps {
  encontroId?: string;
  id?: string;
  apiClient?: typeof api;
  selectedUserId?: string | null;
  userPapel?: string;
}

export function RegistrarPresenca({
  encontroId,
  id,
  apiClient = api,
  selectedUserId,
  userPapel,
}: RegistrarPresencaProps) {
  if (selectedUserId === null || (userPapel !== undefined && userPapel !== 'participante')) {
    return (
      <section className="state-panel">
        <span className="eyebrow">Acesso restrito</span>
        <h2>Área exclusiva de participantes</h2>
        <p>Acesso negado ou usuário não autorizado.</p>

        <Link to="/" className="button button--secondary">
          Voltar para a programação
        </Link>
      </section>
    );
  }

  const targetId = encontroId || id;
  const {
    codigo,
    setCodigo,
    submitting,
    successMessage,
    error,
    registrar,
    fila,
    isOnline,
  } = useRegistrarPresenca(targetId, apiClient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registrar();
  };

  return (
    <section className="registrar-presenca-container" data-testid="registrar-presenca-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Participante</span>
          <h2>Registrar Presença</h2>
          <p>Digite o código do encontro fornecido pela organização para registrar sua presença.</p>
        </div>
        <div className="network-status" data-testid="network-status">
          Status: {isOnline ? <span className="online">Online</span> : <span className="offline">Offline</span>}
        </div>
      </div>

      {successMessage && (
        <div className="success-message" role="status" aria-live="polite" data-testid="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert" data-testid="error-message">
          <strong>Erro ({error.erro}):</strong> <span>{error.mensagem}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="field">
          <label htmlFor="codigo-input">Código do Encontro:</label>
          <input
            id="codigo-input"
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex.: K7M2QX"
            required
            disabled={submitting}
            data-testid="codigo-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting || !codigo.trim()}
            className="button button--primary"
            data-testid="submit-button"
          >
            {submitting ? 'Registrando...' : 'Registrar Presença'}
          </button>
        </div>
      </form>

      {fila.length > 0 && (
        <div className="fila-offline-section" data-testid="fila-offline-section">
          <h3>Fila Offline / Pendentes de Sincronização</h3>
          <ul className="fila-lista" data-testid="fila-offline-lista">
            {fila.map((item) => (
              <li key={item.localId} data-testid="fila-item" className={`fila-item status-${item.status}`}>
                <div><strong>Código:</strong> {item.codigo}</div>
                <div><strong>Status:</strong> <span data-testid="item-status">{item.status}</span></div>
                {item.mensagem && (
                  <div className="item-erro" data-testid="item-erro">
                    <strong>Motivo:</strong> {item.mensagem}
                  </div>
                )}
                <div><small>Lido em: {new Date(item.lidoEm).toLocaleTimeString()}</small></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
