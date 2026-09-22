import { useState } from 'react';
import { api } from '../api/client';
import { VerificacaoCertificado } from '../api/types';
import { formatarDataHoraBrasilia } from '../utils/date';

interface VerificarCertificadoProps {
  apiClient?: typeof api;
}

export function VerificarCertificado({
  apiClient = api,
}: VerificarCertificadoProps) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<VerificacaoCertificado | null>(
    null
  );
  const [erro, setErro] = useState<{ erro: string; mensagem: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const codigoNormalizado = codigo.trim().toUpperCase();
    setLoading(true);
    setResultado(null);
    setErro(null);

    try {
      const verificacao = await apiClient.getCertificadoPorCodigo(
        codigoNormalizado
      );
      setResultado(verificacao);
    } catch (err: any) {
      setErro({
        erro: err?.erro || 'ERRO_DESCONHECIDO',
        mensagem:
          err?.mensagem || err?.message || 'Erro ao verificar o certificado',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Verificação pública</span>
          <h2>Verificar Certificado</h2>
          <p>
            Confira a autenticidade de um certificado pelo seu código, sem
            necessidade de identificação.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-card__header">
          <div className="form-card__header-content">
            <h3>Consulta pública por código</h3>
            <p>Digite o código impresso no certificado.</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="verificar-certificado-codigo">
            Código do Certificado:
          </label>
          <input
            id="verificar-certificado-codigo"
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex.: SA26-7K2M-9QXA"
            disabled={loading}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar Certificado'}
          </button>
        </div>
      </form>

      {loading && (
        <div
          className="state-message state-message--loading"
          role="status"
          aria-live="polite"
        >
          <span className="loading-indicator" aria-hidden="true" />
          <span>Verificando certificado...</span>
        </div>
      )}

      {erro && !loading && (
        <div className="error-message" role="alert">
          {erro.erro === 'NAO_ENCONTRADO' ? (
            <strong>Certificado não encontrado.</strong>
          ) : (
            <strong>Não foi possível verificar o certificado.</strong>
          )}
          <span>
            Erro ({erro.erro}): {erro.mensagem}
          </span>
        </div>
      )}

      {resultado && !loading && !erro && (
        <section
          className="meus-certificados-container"
          data-testid="verificar-certificado-container"
        >
          <h3>{resultado.atividade}</h3>
          <ul className="certificados-list">
            <li>
              <div>
                <strong>Código: {resultado.codigo}</strong>
                <span>Participante: {resultado.participante}</span>
                <span>Atividade: {resultado.atividade}</span>
                <span>
                  Carga horária: {resultado.cargaHorariaMinutos} minutos
                </span>
                <span>
                  Emitido em:{' '}
                  {formatarDataHoraBrasilia(resultado.emitidoEm)}
                </span>
              </div>
            </li>
          </ul>
        </section>
      )}
    </section>
  );
}