import { useEffect, useState } from 'react';
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

  return <MeusCertificadosParticipante apiClient={apiClient} />;
}

function MeusCertificadosParticipante({
  apiClient,
}: {
  apiClient: typeof api;
}) {
  const { certificados, loading, error, recarregar } =
    useCertificados(apiClient);

  const [atividadesPendentes, setAtividadesPendentes] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  useEffect(() => {

    let ativo = true;

    apiClient
      .getExtrato()
      .then((extrato) => {
        if (ativo) {
          setAtividadesPendentes(
            extrato.itens.filter((item) => item.codigo === null)
          );
        }
      })
      .catch(() => {
        if (ativo) {
          setAtividadesPendentes([]);
        }
      });

    return () => {
      ativo = false;
    };
  }, [apiClient]);

  async function emitir(atividadeId: string) {
    setFeedback(null);

    try {
      await apiClient.emitirCertificado(atividadeId);

      setFeedback({
        tipo: 'sucesso',
        mensagem: 'Certificado emitido com sucesso.',
      });

      setAtividadesPendentes((atuais) =>
        atuais.filter((atividade) => atividade.atividadeId !== atividadeId)
      );

      await recarregar();
    } catch (err: any) {
      const codigo = err?.erro || 'ERRO_DESCONHECIDO';
      const mensagem =
        err?.mensagem || err?.message || 'Não foi possível emitir o certificado.';

      setFeedback({
        tipo: 'erro',
        mensagem: `${codigo}: ${mensagem}`,
      });
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Certificados</span>
          <h2>Meus Certificados</h2>
          <p>Certificados já emitidos para a sua participação.</p>
        </div>
      </div>

      {feedback && (
        <div
          className={
            feedback.tipo === 'erro' ? 'error-message' : 'success-message'
          }
          role={feedback.tipo === 'erro' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.mensagem}
        </div>
      )}

      {atividadesPendentes.length > 0 && (
        <section>
          <h3>Certificados disponíveis para emissão</h3>

          <ul>
            {atividadesPendentes.map((atividade) => (
              <li key={atividade.atividadeId}>
                <span>{atividade.titulo}</span>

                <button
                  type="button"
                  onClick={() => emitir(atividade.atividadeId)}
                >
                  Emitir certificado
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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