import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createUtmUrl, getUtmUrls } from '../services/api.js';
import Login from './Login.jsx';
import '../styles/crm.css';

const PLATAFORMAS = [
  { value: 'meta', label: 'Meta' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'organico', label: 'Orgánico' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
];

const PLATAFORMA_LABELS = Object.fromEntries(PLATAFORMAS.map((p) => [p.value, p.label]));

const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#6B6B6B',
  background: '#FAFAFA',
  borderBottom: '1px solid #E4E4E7',
};

const tdStyle = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#1F1F1F',
  borderBottom: '1px solid #EEEEEF',
  verticalAlign: 'middle',
  maxWidth: 320,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #DADADE',
  background: '#fff',
  color: '#1F1F1F',
  fontSize: 13,
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const labelStyle = {
  display: 'block',
  margin: '0 0 6px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '.04em',
  color: '#6B6B6B',
};

const navLinkStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  background: '#fff',
  color: '#1F1F1F',
  textDecoration: 'none',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 600,
  fontSize: 12,
  boxShadow: '0 1px 2px rgba(0,0,0,.04)',
};

function copyButtonStyle(copied) {
  return {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #DADADE',
    background: copied ? '#714B67' : '#fff',
    color: copied ? '#fff' : '#1F1F1F',
    cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
    fontSize: 11,
    whiteSpace: 'nowrap',
  };
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <button onClick={handleCopy} style={copyButtonStyle(copied)}>
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function formatFecha(isoString) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
}

function GeneradorUTMView() {
  const { token, logout } = useAuth();
  const [plataforma, setPlataforma] = useState(PLATAFORMAS[0].value);
  const [campana, setCampana] = useState('');
  const [contenido, setContenido] = useState('');
  const [generando, setGenerando] = useState(false);
  const [formError, setFormError] = useState('');
  const [ultimaUrl, setUltimaUrl] = useState(null);

  const [historial, setHistorial] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const loadHistorial = useCallback(() => {
    setStatus('loading');
    setError('');
    return getUtmUrls(token)
      .then((data) => {
        setHistorial(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message);
        setStatus('error');
      });
  }, [token, logout]);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!campana.trim()) return;

    setGenerando(true);
    setFormError('');

    createUtmUrl(token, {
      utm_source: plataforma,
      utm_campaign: campana.trim(),
      utm_content: contenido.trim() || undefined,
    })
      .then((nueva) => {
        setUltimaUrl(nueva.url_completa);
        setHistorial((prev) => [{ ...nueva, created_at: new Date().toISOString() }, ...prev]);
        setCampana('');
        setContenido('');
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setFormError(err.message);
      })
      .finally(() => setGenerando(false));
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F9F9F9',
        color: '#1F1F1F',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        padding: '32px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p
            style={{
              margin: '0 0 4px',
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
          <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22 }}>
            Generador de URLs con UTMs
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/crm" style={navLinkStyle}>
            Ver leads
          </Link>
          <Link to="/crm/dashboard" style={navLinkStyle}>
            Dashboard
          </Link>
          <button onClick={logout} style={{ ...navLinkStyle, cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          border: '1px solid #E4E4E7',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          padding: '20px 22px',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          alignItems: 'end',
        }}
      >
        <div>
          <label style={labelStyle}>Plataforma</label>
          <select
            className="crm-select"
            style={{ ...inputStyle, padding: '10px 12px' }}
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
          >
            {PLATAFORMAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Campaña</label>
          <input className="crm-input" style={inputStyle} value={campana} onChange={(e) => setCampana(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Content / variante (opcional)</label>
          <input className="crm-input" style={inputStyle} value={contenido} onChange={(e) => setContenido(e.target.value)} />
        </div>
        <div>
          <button
            type="submit"
            disabled={generando}
            style={{
              width: '100%',
              padding: '11px 20px',
              borderRadius: 6,
              border: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,.12)',
              background: generando ? '#B79AB1' : '#714B67',
              color: '#fff',
              cursor: generando ? 'default' : 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            {generando ? 'Generando…' : 'Generar URL'}
          </button>
        </div>
        {formError && (
          <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 12, color: '#DC3545' }}>{formError}</p>
        )}
      </form>

      {ultimaUrl && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(113,75,103,.06)',
            border: '1px solid rgba(113,75,103,.3)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, wordBreak: 'break-all', flex: 1, color: '#1F1F1F' }}>{ultimaUrl}</p>
          <CopyButton text={ultimaUrl} />
        </div>
      )}

      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, margin: '0 0 14px', color: '#1F1F1F' }}>
        Historial
      </h2>

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando historial…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
          <button
            onClick={loadHistorial}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,.12)',
              background: '#714B67',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && historial.length === 0 && (
        <p style={{ color: '#6B6B6B' }}>Todavía no se ha generado ninguna URL.</p>
      )}

      {status === 'ready' && historial.length > 0 && (
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid #E4E4E7',
            borderRadius: 10,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}
        >
          <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>URL</th>
                <th style={thStyle}>Plataforma</th>
                <th style={thStyle}>Campaña</th>
                <th style={thStyle}>Creado por</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id}>
                  <td style={tdStyle} title={h.url_completa}>
                    {h.url_completa}
                  </td>
                  <td style={tdStyle}>{PLATAFORMA_LABELS[h.utm_source] ?? h.utm_source}</td>
                  <td style={tdStyle}>{h.utm_campaign}</td>
                  <td style={tdStyle}>{h.creado_por_nombre}</td>
                  <td style={tdStyle}>{formatFecha(h.created_at)}</td>
                  <td style={{ ...tdStyle, overflow: 'visible', whiteSpace: 'nowrap' }}>
                    <CopyButton text={h.url_completa} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function GeneradorUTM() {
  const { token } = useAuth();
  return token ? <GeneradorUTMView /> : <Login />;
}
