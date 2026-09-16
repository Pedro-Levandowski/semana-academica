import React from 'react';
import { useInRouterContext, MemoryRouter, Routes, Route } from 'react-router-dom';
import { useSelectedUser } from './hooks/useSelectedUser';
import { UserSelector } from './components/UserSelector';
import { useProgramacao, DIAS_SEMANA } from './hooks/useProgramacao';
import { Programacao } from './components/Programacao';
import { AtividadeDetalhe } from './components/AtividadeDetalhe';
import { CriarAtividade } from './components/CriarAtividade';
import { EditarAtividade } from './components/EditarAtividade';
import { api } from './api/client';

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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header>
        <h1>Semana Acadêmica</h1>
      </header>
      <main>
        <UserSelector
          selectedUser={selectedUser}
          onSelectUser={selectUser}
          users={users}
        />

        <div style={{ marginTop: '2rem' }} data-testid="active-user-info">
          {selectedUser ? (
            <div>
              <p>Usuário ativo: <strong>{selectedUser.nome}</strong> ({selectedUser.papel})</p>
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
                  element={<CriarAtividade selectedUserId={selectedUser.id} userPapel={selectedUser.papel} apiClient={apiClient} />}
                />
                <Route
                  path="/atividades/:id/editar"
                  element={<EditarAtividade selectedUserId={selectedUser.id} userPapel={selectedUser.papel} apiClient={apiClient} />}
                />
                <Route
                  path="/atividades/:id"
                  element={<AtividadeDetalhe selectedUserId={selectedUser.id} userPapel={selectedUser.papel} apiClient={apiClient} />}
                />
              </Routes>
            </div>
          ) : (
            <div>
              <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
              <Routes>
                <Route
                  path="/atividades/nova"
                  element={<CriarAtividade selectedUserId={null} userPapel={undefined} apiClient={apiClient} />}
                />
                <Route
                  path="/atividades/:id/editar"
                  element={<EditarAtividade selectedUserId={null} userPapel={undefined} apiClient={apiClient} />}
                />
                <Route
                  path="/atividades/:id"
                  element={<AtividadeDetalhe selectedUserId={null} apiClient={apiClient} />}
                />
                <Route path="*" element={null} />
              </Routes>
            </div>
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
