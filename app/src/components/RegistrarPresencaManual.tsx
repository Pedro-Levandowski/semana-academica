import React from 'react';
import { Link } from 'react-router-dom';
import { useRegistrarPresencaManual } from '../hooks/useRegistrarPresencaManual';
import { api } from '../api/client';

interface RegistrarPresencaManualProps {
  encontroId?: string;
  id?: string;
  apiClient?: typeof api;
  selectedUserId?: string | null;
  userPapel?: string;
}

export function RegistrarPresencaManual({
  encontroId,
  id,
  apiClient = api,
  selectedUserId,
  userPapel,
}: RegistrarPresencaManualProps) {
  if (selectedUserId === null || (userPapel !== undefined && userPapel !== 'organizacao')) {
    return (
      <section className="state-panel">
        <span className="eyebrow">Acesso restrito</span>
        <h2>Área exclusiva da organização</h2>
        <p>Acesso negado ou usuário não autorizado.</p>

        <Link to="/" className="button button--secondary">
          Voltar para a programação
        </Link>
      </section>
    );
  }

  const targetId = encontroId || id;
  const {
    participanteId,
    setParticipanteId,
    justificativa,
    setJustificativa,
    submitting,
    successMessage,
    error,
    registrarManual,
  } = useRegistrarPresencaManual(targetId, apiClient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registrarManual();
  };

  return (
    <section className="registrar-presenca-manual-container" data-testid="registrar-presenca-manual-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Organização</span>
          <h2>Lançar Presença Manual</h2>
          <p>Registre a presença de um participante manualmente informando o ID e a justificativa.</p>
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
          <label htmlFor="participante-id-input">ID do Participante:</label>
          <input
            id="participante-id-input"
            type="text"
            value={participanteId}
            onChange={(e) => setParticipanteId(e.target.value)}
            placeholder="Ex.: p-carla"
            required
            disabled={submitting}
            data-testid="participante-id-input"
          />
        </div>

        <div className="field">
          <label htmlFor="justificativa-input">Justificativa:</label>
          <textarea
            id="justificativa-input"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Informe a justificativa (mínimo de 10 caracteres)..."
            required
            rows={4}
            disabled={submitting}
            data-testid="justificativa-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting || !participanteId.trim() || !justificativa.trim()}
            className="button button--primary"
            data-testid="submit-button"
          >
            {submitting ? 'Registrando...' : 'Registrar Presença Manual'}
          </button>
        </div>
      </form>
    </section>
  );
}
