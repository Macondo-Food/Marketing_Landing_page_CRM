import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const labelStyle = {
  display: 'block',
  margin: '0 0 6px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '.04em',
  color: '#B4B4B4',
};

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!usuario.trim() || !password) return;

    setStatus('loading');
    setError('');
    login(usuario.trim(), password).catch((err) => {
      setError(err.message);
      setStatus('error');
    });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#0C0C0C',
          border: '1px solid rgba(248,245,34,.35)',
          borderRadius: 14,
          padding: '32px 28px',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#F8F522',
          }}
        >
          CRM Macondo
        </p>
        <h1
          style={{
            margin: '0 0 24px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          Inicia sesión
        </h1>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={inputStyle}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </div>

        {status === 'error' && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#FF6B6B' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            padding: '12px 28px',
            borderRadius: 999,
            border: 'none',
            background: status === 'loading' ? 'rgba(248,245,34,.35)' : '#F8F522',
            color: '#000',
            cursor: status === 'loading' ? 'default' : 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          {status === 'loading' ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
