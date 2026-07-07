import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out

  function refresh() {
    return authApi.me().then((r) => setUser(r.authed ? r : null)).catch(() => setUser(null));
  }

  useEffect(() => {
    refresh();
  }, []);

  return <Ctx.Provider value={{ user, setUser, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
