import React from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { useSelectedUser } from './hooks/useSelectedUser';
import { UserSelector } from './components/UserSelector';
import { useProgramacao, DIAS_SEMANA } from './hooks/useProgramacao';
import { Programacao } from './components/Programacao';
import { AtividadeDetalhe } from './components/AtividadeDetalhe';
import { api } from './api/client';

interface AppProps {
  apiClient?: typeof api;
  initialEntries?: string[];
}

export function App({ apiClient = api, initialEntries }: AppProps) {
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

  const RouterComponent = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <RouterComponent {...routerProps}>
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Semana Acadêmica</h1>

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
                    />
                  }
                />
                <Route
                  path="/atividades/:id"
                  element={<AtividadeDetalhe selectedUserId={selectedUser?.id || null} apiClient={apiClient} />}
                />
              </Routes>
            </div>
          ) : (
            <div>
              <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
              <Routes>
                <Route
                  path="/atividades/:id"
                  element={<AtividadeDetalhe selectedUserId={null} apiClient={apiClient} />}
                />
                <Route path="*" element={null} />
              </Routes>
            </div>
          )}
        </div>
      </div>
    </RouterComponent>
  );
}

export default App;
