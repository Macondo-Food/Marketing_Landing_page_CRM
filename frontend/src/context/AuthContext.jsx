import { createContext, useContext, useState } from 'react';
import { loginRequest, loginGoogleRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);

  async function login(email, password) {
    const data = await loginRequest(email, password);
    setToken(data.token);
    setUsuario(data.usuario);
  }

  async function loginGoogle(idToken) {
    const data = await loginGoogleRequest(idToken);
    setToken(data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, login, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
