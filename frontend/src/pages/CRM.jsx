import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getLeads, updateLeadEstado } from '../services/api.js';
import Login from './Login.jsx';

const ESTADOS_EDITABLES = [
  'con_requisitos',
  'sin_requisitos_reunion',
  'reunion_cierre',
  'venta_servicio',
];

const ESTADO_LABELS = {
  descalificado: 'Descalificado',
  calificado: 'Calificado',
  agendado: 'Agendado',
  con_requisitos: 'Con requisitos',
  sin_requisitos_reunion: 'Sin requisitos (reunión)',
  reunion_cierre: 'Reunión de cierre',
  venta_servicio: 'Venta / servicio',
};

const ESTADO_COLORS = {
  descalificado: { bg: 'rgba(180,180,180,.15)', text: '#B4B4B4' },
  calificado: { bg: 'rgba(248,245,34,.15)', text: '#F8F522' },
  agendado: { bg: 'rgba(59,130,246,.15)', text: '#60A5FA' },
  con_requisitos: { bg: 'rgba(34,184,207,.15)', text: '#22B8CF' },
  sin_requisitos_reunion: { bg: 'rgba(245,158,11,.15)', text: '#F59E0B' },
  reunion_cierre: { bg: 'rgba(167,139,250,.15)', text: '#A78BFA' },
  venta_servicio: { bg: 'rgba(74,222,128,.15)', text: '#4ADE80' },
};

function EstadoBadge({ estado }) {
  const color = ESTADO_COLORS[estado] ?? ESTADO_COLORS.descalificado;
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
      {ESTADO_LABELS[estado] ?? estado}
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

const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: '#B4B4B4',
  borderBottom: '1px solid rgba(255,255,255,.12)',
};

const tdStyle = {
  padding: '12px 14px',
  fontSize: 14,
  borderBottom: '1px solid rgba(255,255,255,.06)',
  verticalAlign: 'middle',
};

const selectStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,.16)',
  background: '#0C0C0C',
  color: '#fff',
  fontSize: 12,
};

function Dashboard() {
  const { token, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  const loadLeads = useCallback(() => {
    setStatus('loading');
    setError('');
    return getLeads(token)
      .then((data) => {
        setLeads(data);
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
    loadLeads();
  }, [loadLeads]);

  function handleEstadoChange(leadId, estado) {
    setSavingId(leadId);
    setRowErrors((prev) => ({ ...prev, [leadId]: '' }));

    updateLeadEstado(token, leadId, estado)
      .then(() => {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, estado } : l)));
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setRowErrors((prev) => ({ ...prev, [leadId]: err.message }));
      })
      .finally(() => setSavingId(null));
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
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
              color: '#F8F522',
            }}
          >
            CRM Macondo
          </p>
          <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22 }}>
            Leads
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to="/crm/dashboard"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,.16)',
              color: '#fff',
              textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Ver dashboard
          </Link>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,.16)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {status === 'loading' && <p style={{ color: '#B4B4B4' }}>Cargando leads…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#FF6B6B', marginBottom: 12 }}>{error}</p>
          <button
            onClick={loadLeads}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: 'none',
              background: '#F8F522',
              color: '#000',
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

      {status === 'ready' && leads.length === 0 && (
        <p style={{ color: '#B4B4B4' }}>Todavía no hay leads registrados.</p>
      )}

      {status === 'ready' && leads.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Teléfono</th>
                <th style={thStyle}>Origen</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Cambiar estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={tdStyle}>{lead.nombre}</td>
                  <td style={tdStyle}>{lead.email}</td>
                  <td style={tdStyle}>{lead.telefono}</td>
                  <td style={tdStyle}>{lead.utm_source ?? '—'}</td>
                  <td style={tdStyle}>
                    <EstadoBadge estado={lead.estado} />
                  </td>
                  <td style={tdStyle}>{formatFecha(lead.created_at)}</td>
                  <td style={tdStyle}>
                    {lead.estado === 'descalificado' ? (
                      <span style={{ color: '#6B6B6B', fontSize: 12 }}>—</span>
                    ) : (
                      <>
                        <select
                          value={ESTADOS_EDITABLES.includes(lead.estado) ? lead.estado : ''}
                          onChange={(e) => handleEstadoChange(lead.id, e.target.value)}
                          disabled={savingId === lead.id}
                          style={selectStyle}
                        >
                          <option value="" disabled>
                            {savingId === lead.id ? 'Guardando…' : 'Cambiar a…'}
                          </option>
                          {ESTADOS_EDITABLES.map((estado) => (
                            <option key={estado} value={estado}>
                              {ESTADO_LABELS[estado]}
                            </option>
                          ))}
                        </select>
                        {rowErrors[lead.id] && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#FF6B6B' }}>
                            {rowErrors[lead.id]}
                          </p>
                        )}
                      </>
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

export default function CRM() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Login />;
}
