import { useExtrato } from '../hooks/useExtrato';
import { api } from '../api/client';

interface ExtratoHorasProps {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient?: typeof api;
}

export function ExtratoHoras({
  selectedUserId,
  userPapel,
  apiClient = api,
}: ExtratoHorasProps) {
  if (!selectedUserId || userPapel !== 'participante') {
    return (
      <section className="state-panel">
        <span className="eyebrow">Acesso restrito</span>
        <h2>Área exclusiva de participantes</h2>
        <p>Acesso negado ou usuário não autorizado.</p>
      </section>
    );
  }

  const { extrato, loading, error } = useExtrato(apiClient);

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Horas complementares</span>
          <h2>Extrato de Horas</h2>
          <p>Atividades elegíveis e totais de horas complementares.</p>
        </div>
      </div>

      {loading && (
        <div
          className="state-message state-message--loading"
          role="status"
          aria-live="polite"
        >
          <span className="loading-indicator" aria-hidden="true" />
          <span>Carregando extrato...</span>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <strong>Não foi possível carregar o extrato.</strong>
          <span>
            Erro ({error.erro}): {error.mensagem}
          </span>
        </div>
      )}

      {!loading && !error && extrato && extrato.itens.length === 0 && (
        <div className="empty-message" role="status" aria-live="polite">
          <strong>Nenhuma atividade elegível</strong>
          <p>Você ainda não possui atividades elegíveis para exibir.</p>
        </div>
      )}

      {!loading && !error && extrato && extrato.itens.length > 0 && (
        <>
          <section
            className="meus-certificados-container"
            data-testid="extrato-container"
          >
            <ul className="certificados-list">
              {extrato.itens.map((item) => (
                <li key={item.atividadeId}>
                  <div>
                    <strong>{item.titulo}</strong>
                    <span>Tipo: {item.tipo}</span>
                    <span>Carga horária: {item.cargaHorariaMinutos} minutos</span>
                    <span>
                      Certificado:{' '}
                      {item.codigo !== null
                        ? item.codigo
                        : 'certificado não emitido'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="metrics-grid" data-testid="extrato-totais">
            <div className="metric-card">
              <span>Palestras</span>
              <strong>{extrato.palestrasMinutos}</strong>
            </div>
            <div className="metric-card">
              <span>Minicursos</span>
              <strong>{extrato.minicursosMinutos}</strong>
            </div>
            <div className="metric-card">
              <span>Total</span>
              <strong>{extrato.totalMinutos}</strong>
            </div>
            <div className="metric-card metric-card--highlight">
              <span>Aproveitado</span>
              <strong>{extrato.aproveitadoMinutos}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
