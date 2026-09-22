import { useCertificados } from '../hooks/useCertificados';
import { api } from '../api/client';
import { formatarDataHoraBrasilia } from '../utils/date';

interface MeusCertificadosProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function MeusCertificados({
  selectedUserId,
  userPapel,
  apiClient = api,
}: MeusCertificadosProps) {
  if (!selectedUserId || userPapel !== 'participante') {
    return (
      <section className="state-panel">
        <span className="eyebrow">Acesso restrito</span>
        <h2>Área exclusiva de participantes</h2>
        <p>Acesso negado ou usuário não autorizado.</p>
      </section>
    );
  }

  const { certificados, loading, error } = useCertificados(apiClient);

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Certificados</span>
          <h2>Meus Certificados</h2>
          <p>Certificados já emitidos para a sua participação.</p>
        </div>
      </div>

      {loading && (
        <div
          className="state-message state-message--loading"
          role="status"
          aria-live="polite"
        >
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando certificados...</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível carregar os certificados.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loading && !error && certificados.length === 0 && (
        <div className="empty-message" role="status" aria-live="polite">
          <strong>Nenhum certificado emitido</strong>
          <p>Você ainda não possui certificados emitidos para exibir.</p>
        </div>
      )}

      {!loading && !error && certificados.length > 0 && (
        <section
          className="meus-certificados-container"
          data-testid="meus-certificados-container"
        >
          <ul className="certificados-list">
            {certificados.map((certificado) => (
              <li key={certificado.codigo}>
                <div>
                  <strong>Código: {certificado.codigo}</strong>
                  <span>Atividade: {certificado.atividadeId}</span>
                  <span>
                    Carga horária: {certificado.cargaHorariaMinutos} minutos
                  </span>
                  <span>
                    Presenças: {certificado.presencas} / {certificado.encontros}{' '}
                    encontros
                  </span>
                  <span>
                    Emitido em:{' '}
                    {formatarDataHoraBrasilia(certificado.emitidoEm)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}