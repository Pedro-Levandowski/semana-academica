import React from "react";
import { User } from "../users";

interface UserSelectorProps {
  selectedUser: User | null;
  onSelectUser: (userId: string | null) => void;
  users: User[];
}

export function UserSelector({ selectedUser, onSelectUser, users }: UserSelectorProps) {
  return (
    <div className="user-selector-container">
      <label htmlFor="demo-user-select">Selecione o usuário de demonstração:</label>
      <select
        id="demo-user-select"
        value={selectedUser?.id || ""}
        onChange={(e) => {
          const val = e.target.value;
          onSelectUser(val ? val : null);
        }}
      >
        <option value="">Selecione um usuário</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.nome} ({user.papel})
          </option>
        ))}
      </select>
    </div>
  );
}
