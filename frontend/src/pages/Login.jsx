import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/crm.css';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #DADADE',
  background: '#fff',
  color: '#1F1F1F',
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
  color: '#6B6B6B',
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
  const { login, loginGoogle } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: googleBtnRef.current.offsetWidth || 304,
      });
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  async function handleGoogleCredential(response) {
    setStatus('loading');
    setError('');
    try {
      await loginGoogle(response.credential);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

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
        background: '#F9F9F9',
        color: '#1F1F1F',
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
          background: '#fff',
          border: '1px solid #E4E4E7',
          borderRadius: 10,
          boxShadow: '0 2px 10px rgba(0,0,0,.06)',
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
            color: '#714B67',
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
            color: '#1F1F1F',
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
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#DC3545' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            padding: '12px 28px',
            borderRadius: 6,
            border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
            background: status === 'loading' ? '#B79AB1' : '#714B67',
            color: '#fff',
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

        {GOOGLE_CLIENT_ID && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '20px 0',
                color: '#999',
                fontSize: 12,
                fontFamily: "'Source Sans 3', system-ui, sans-serif",
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#E4E4E7' }} />
              <span>o</span>
              <div style={{ flex: 1, height: 1, background: '#E4E4E7' }} />
            </div>

            <div
              ref={googleBtnRef}
              style={{ display: 'flex', justifyContent: 'center' }}
            />
          </>
        )}
      </form>
    </div>
  );
}
