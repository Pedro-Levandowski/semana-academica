import React from 'react';
import { useRegistrarPresenca } from '../hooks/useRegistrarPresenca';
import { api } from '../api/client';

interface RegistrarPresencaProps {
  encontroId?: string;
  id?: string;
  apiClient?: typeof api;
}

export function RegistrarPresenca({
  encontroId,
  id,
  apiClient = api,
}: RegistrarPresencaProps) {
  const targetId = encontroId || id;
  const {
    codigo,
    setCodigo,
    submitting,
    successMessage,
    error,
    registrar,
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
    </section>
  );
}
