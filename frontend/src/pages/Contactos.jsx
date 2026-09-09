import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getContactos, updateContactoContactado } from '../services/api.js';
import { LANDINGS } from '../utils/landings.js';
import Login from './Login.jsx';
import '../styles/crm.css';

const LANDING_LABELS = Object.fromEntries(LANDINGS.map((l) => [l.id, l.nombre]));

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
  fontSize: 14,
  color: '#1F1F1F',
  borderBottom: '1px solid #EEEEEF',
  verticalAlign: 'middle',
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

function ContactadoBadge({ contactado }) {
  const color = contactado
    ? { bg: 'rgba(21,128,61,.12)', text: '#15803D' }
    : { bg: 'rgba(180,83,9,.12)', text: '#B45309' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: color.bg,
        color: color.text,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {contactado ? 'Sí' : 'No'}
    </span>
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

function ContactosView() {
  const { token, usuario, logout } = useAuth();
  const [contactos, setContactos] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [filtroLanding, setFiltroLanding] = useState('');

  const loadContactos = useCallback(() => {
    setStatus('loading');
    setError('');
    return getContactos(token, filtroLanding || undefined)
      .then((data) => {
        setContactos(data);
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
  }, [token, logout, filtroLanding]);

  useEffect(() => {
    loadContactos();
  }, [loadContactos]);

  function handleToggleContactado(contacto) {
    const nuevoValor = !contacto.contactado;
    setSavingId(contacto.id);
    setRowErrors((prev) => ({ ...prev, [contacto.id]: '' }));

    updateContactoContactado(token, contacto.id, nuevoValor)
      .then(() => {
        setContactos((prev) =>
          prev.map((c) => (c.id === contacto.id ? { ...c, contactado: nuevoValor } : c))
        );
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setRowErrors((prev) => ({ ...prev, [contacto.id]: err.message }));
      })
      .finally(() => setSavingId(null));
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
            Contactos
          </h1>
          {usuario?.nombre && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6B6B6B' }}>Hola, {usuario.nombre}</p>
          )}
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

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginRight: 8 }}>Landing:</label>
        <select
          className="crm-select"
          value={filtroLanding}
          onChange={(e) => setFiltroLanding(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #DADADE', fontSize: 12 }}
        >
          <option value="">Todas</option>
          {LANDINGS.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre}</option>
          ))}
        </select>
      </div>

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando contactos…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
          <button
            onClick={loadContactos}
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

      {status === 'ready' && contactos.length === 0 && (
        <p style={{ color: '#6B6B6B' }}>Todavía no hay contactos descalificados registrados.</p>
      )}

      {status === 'ready' && contactos.length > 0 && (
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
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Teléfono</th>
                <th style={thStyle}>Empresa</th>
                <th style={thStyle}>Landing</th>
                <th style={thStyle}>Motivo de descalificación</th>
                <th style={thStyle}>Contactado</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {contactos.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>{c.nombre}</td>
                  <td style={tdStyle}>{c.email}</td>
                  <td style={tdStyle}>{c.telefono}</td>
                  <td style={tdStyle}>{c.empresa}</td>
                  <td style={tdStyle}>{LANDING_LABELS[c.landing] ?? c.landing}</td>
                  <td style={{ ...tdStyle, maxWidth: 320 }}>{c.motivo_descalificacion ?? '—'}</td>
                  <td style={tdStyle}>
                    <ContactadoBadge contactado={Boolean(c.contactado)} />
                  </td>
                  <td style={tdStyle}>{formatFecha(c.created_at)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggleContactado(c)}
                      disabled={savingId === c.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #DADADE',
                        background: '#fff',
                        color: '#1F1F1F',
                        cursor: savingId === c.id ? 'default' : 'pointer',
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 600,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {savingId === c.id
                        ? 'Guardando…'
                        : c.contactado
                        ? 'Marcar no contactado'
                        : 'Marcar contactado'}
                    </button>
                    {rowErrors[c.id] && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#DC3545' }}>{rowErrors[c.id]}</p>
                    )}
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

export default function Contactos() {
  const { token } = useAuth();
  return token ? <ContactosView /> : <Login />;
}
