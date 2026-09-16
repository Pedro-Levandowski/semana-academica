import React from 'react';
import { useSelectedUser } from './hooks/useSelectedUser';
import { UserSelector } from './components/UserSelector';
import { useProgramacao, DIAS_SEMANA } from './hooks/useProgramacao';
import { Programacao } from './components/Programacao';
import { api } from './api/client';

interface AppProps {
  apiClient?: typeof api;
}

export function App({ apiClient = api }: AppProps) {
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

  return (
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
          </div>
        ) : (
          <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
        )}
      </div>
    </div>
  );
}

export default App;
