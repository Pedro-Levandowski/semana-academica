import React from 'react';
import { User } from '../users';

interface UserSelectorProps {
  selectedUser: User | null;
  onSelectUser: (userId: string | null) => void;
  users: User[];
}

export function UserSelector({
  selectedUser,
  onSelectUser,
  users,
}: UserSelectorProps) {
  return (
    <div className="user-selector-container">
      <div className="user-selector-container__heading">
        <span className="user-selector-container__indicator" aria-hidden="true" />
        <label htmlFor="demo-user-select">
          Selecione o usuário de demonstração:
        </label>
      </div>

      <select
        id="demo-user-select"
        value={selectedUser?.id || ''}
        onChange={(event) => {
          const value = event.target.value;
          onSelectUser(value || null);
        }}
      >
        <option value="">Selecione um usuário</option>

        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.nome} ({user.papel})
          </option>
        ))}
      </select>

      <span className="user-selector-container__helper">
        A seleção fica salva neste navegador.
      </span>
    </div>
  );
}