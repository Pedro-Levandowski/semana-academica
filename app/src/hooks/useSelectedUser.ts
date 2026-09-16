import { useState } from "react";
import { User, INITIAL_USERS } from "../users";

export function useSelectedUser() {
  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem("selectedUserId");
    if (savedId) {
      const found = INITIAL_USERS.find((u) => u.id === savedId);
      if (found) return found;
    }
    return null;
  });

  const selectUser = (userId: string | null) => {
    if (!userId) {
      localStorage.removeItem("selectedUserId");
      setSelectedUser(null);
    } else {
      const found = INITIAL_USERS.find((u) => u.id === userId);
      if (found) {
        localStorage.setItem("selectedUserId", userId);
        setSelectedUser(found);
      } else {
        localStorage.removeItem("selectedUserId");
        setSelectedUser(null);
      }
    }
  };

  return {
    selectedUser,
    selectUser,
    users: INITIAL_USERS,
  };
}
