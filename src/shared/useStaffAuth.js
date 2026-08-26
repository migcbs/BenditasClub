// src/shared/useStaffAuth.js
import { useState, useCallback } from 'react';
import { staffLogin } from './staffApi';

const TOKEN_KEY = 'bc_staff_token';
const USER_KEY = 'bc_staff_user';

export const useStaffAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (sucursal, pin) => {
    const { token: newToken, user: newUser } = await staffLogin(sucursal, pin);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, login, logout };
};
