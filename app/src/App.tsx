import React from 'react';
import { useSelectedUser } from './hooks/useSelectedUser';
import { UserSelector } from './components/UserSelector';

export function App() {
  const { selectedUser, selectUser, users } = useSelectedUser();

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
          </div>
        ) : (
          <p>Nenhum usuário selecionado. Por favor, selecione um usuário de demonstração para acessar o sistema.</p>
        )}
      </div>
    </div>
  );
}

export default App;
