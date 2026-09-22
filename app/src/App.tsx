import React from 'react';
import { useInRouterContext, MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import { useSelectedUser } from './hooks/useSelectedUser';
import { UserSelector } from './components/UserSelector';
import { useProgramacao, DIAS_SEMANA } from './hooks/useProgramacao';
import { Programacao } from './components/Programacao';
import { AtividadeDetalhe } from './components/AtividadeDetalhe';
import { CriarAtividade } from './components/CriarAtividade';
import { EditarAtividade } from './components/EditarAtividade';
import { CodigoEncontro } from './components/CodigoEncontro';
import { RegistrarPresenca } from './components/RegistrarPresenca';
import { RegistrarPresencaManual } from './components/RegistrarPresencaManual';
import { MeusCertificados } from './components/MeusCertificados';
import { ExtratoHoras } from './components/ExtratoHoras';
import { VerificarCertificado } from './components/VerificarCertificado';
import { api } from './api/client';

function CodigoEncontroRoute({
  selectedUserId,
  userPapel,
  apiClient,
}: {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient: typeof api;
}) {
  const { encontroId } = useParams<{ encontroId: string }>();
  return (
    <CodigoEncontro
      encontroId={encontroId}
      selectedUserId={selectedUserId}
      userPapel={userPapel}
      apiClient={apiClient}
    />
  );
}

function RegistrarPresencaRoute({
  selectedUserId,
  userPapel,
  apiClient,
}: {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient: typeof api;
}) {
  const { encontroId } = useParams<{ encontroId: string }>();
  return (
    <RegistrarPresenca
      encontroId={encontroId}
      selectedUserId={selectedUserId}
      userPapel={userPapel}
      apiClient={apiClient}
    />
  );
}

function RegistrarPresencaManualRoute({
  selectedUserId,
  userPapel,
  apiClient,
}: {
  selectedUserId: string | null;
  userPapel?: string;
  apiClient: typeof api;
}) {
  const { encontroId } = useParams<{ encontroId: string }>();
  return (
    <RegistrarPresencaManual
      encontroId={encontroId}
      selectedUserId={selectedUserId}
      userPapel={userPapel}
      apiClient={apiClient}
    />
  );
}

interface AppProps {
  apiClient?: typeof api;
  initialEntries?: string[];
}

export function App({ apiClient = api, initialEntries }: AppProps) {
  const inRouter = useInRouterContext();
  const { selectedUser, selectUser, users } = useSelectedUser();

  const {
    dia,
    setDia,
    tipo,
    setTipo,
    atividades,
    salas,
    loading,
    error,
  } = useProgramacao(selectedUser?.id || null, apiClient);

  const content = (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              SA
            </span>

            <div className="brand__content">
              <h1>Semana Acadêmica</h1>
              <p>Programação oficial · 19 a 23 de outubro de 2026</p>
            </div>
          </div>

          <UserSelector
            selectedUser={selectedUser}
            onSelectUser={selectUser}
            users={users}
          />
        </div>
      </header>

      <main className="app-main">
        <div className="app-content" data-testid="active-user-info">
          {selectedUser ? (
            <>
              <section className="active-user-card" aria-label="Usuário ativo">
                <div className="active-user-card__avatar" aria-hidden="true">
                  {selectedUser.nome.charAt(0)}
                </div>

                <div className="active-user-card__content">
                  <span className="active-user-card__label">Navegando como</span>
                  <p>
                    Usuário ativo: <strong>{selectedUser.nome}</strong> ({selectedUser.papel})
                  </p>
                </div>
              </section>

              <Routes>
                <Route
                  path="/"
                  element={
                    <Programacao
                      dia={dia}
                      setDia={setDia}
                      tipo={tipo}
                      setTipo={setTipo}
                      atividades={atividades}
                      salas={salas}
                      loading={loading}
                      error={error}
                      dias={DIAS_SEMANA}
                      userPapel={selectedUser.papel}
                    />
                  }
                />

                <Route
                  path="/atividades/nova"
                  element={
                    <CriarAtividade
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/atividades/:id/editar"
                  element={
                    <EditarAtividade
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/atividades/:id"
                  element={
                    <AtividadeDetalhe
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/codigo"
                  element={
                    <CodigoEncontroRoute
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/presenca"
                  element={
                    <RegistrarPresencaRoute
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/presenca-manual"
                  element={
                    <RegistrarPresencaManualRoute
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/certificados"
                  element={
                    <MeusCertificados
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/extrato"
                  element={
                    <ExtratoHoras
                      selectedUserId={selectedUser.id}
                      userPapel={selectedUser.papel}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/verificar"
                  element={<VerificarCertificado apiClient={apiClient} />}
                />
              </Routes>
            </>
          ) : (
            <>
              <section className="welcome-panel">
                <div className="welcome-panel__icon" aria-hidden="true">
                  SA
                </div>

                <div>
                  <span className="eyebrow">Bem-vindo</span>
                  <h2>Consulte a programação da Semana Acadêmica</h2>
                  <p>
                    Nenhum usuário selecionado. Por favor, selecione um usuário de
                    demonstração para acessar o sistema.
                  </p>
                </div>
              </section>

              <Routes>
                <Route
                  path="/atividades/nova"
                  element={
                    <CriarAtividade
                      selectedUserId={null}
                      userPapel={undefined}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/atividades/:id/editar"
                  element={
                    <EditarAtividade
                      selectedUserId={null}
                      userPapel={undefined}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/atividades/:id"
                  element={
                    <AtividadeDetalhe
                      selectedUserId={null}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/codigo"
                  element={
                    <CodigoEncontroRoute
                      selectedUserId={null}
                      userPapel={undefined}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/presenca"
                  element={
                    <RegistrarPresencaRoute
                      selectedUserId={null}
                      userPapel={undefined}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/encontros/:encontroId/presenca-manual"
                  element={
                    <RegistrarPresencaManualRoute
                      selectedUserId={null}
                      userPapel={undefined}
                      apiClient={apiClient}
                    />
                  }
                />

                <Route
                  path="/verificar"
                  element={<VerificarCertificado apiClient={apiClient} />}
                />

                <Route path="*" element={null} />
              </Routes>
            </>
          )}
        </div>
      </main>
    </div>
  );

  const isTest = (import.meta as any).env?.MODE === 'test';
  const routerEntries = initialEntries || (!inRouter && isTest ? ['/'] : undefined);

  if (routerEntries && !inRouter) {
    return (
      <MemoryRouter initialEntries={routerEntries}>
        {content}
      </MemoryRouter>
    );
  }

  return content;
}

export default App;