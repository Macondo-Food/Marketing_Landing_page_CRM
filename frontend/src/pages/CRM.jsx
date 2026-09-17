import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getLeads, updateLeadEstado } from '../services/api.js';
import { LANDINGS } from '../utils/landings.js';
import Login from './Login.jsx';
import LeadDetalle from './LeadDetalle.jsx';
import '../styles/crm.css';

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
  descalificado: { bg: 'rgba(107,107,107,.12)', text: '#6B6B6B' },
  calificado: { bg: 'rgba(217,164,6,.15)', text: '#9A7B0A' },
  agendado: { bg: 'rgba(37,99,235,.12)', text: '#2563EB' },
  con_requisitos: { bg: 'rgba(14,116,144,.12)', text: '#0E7490' },
  sin_requisitos_reunion: { bg: 'rgba(180,83,9,.12)', text: '#B45309' },
  reunion_cierre: { bg: 'rgba(124,58,237,.12)', text: '#7C3AED' },
  venta_servicio: { bg: 'rgba(21,128,61,.12)', text: '#15803D' },
};

const PRIORIDAD_LABELS = {
  vip: 'VIP',
  alta: 'Alta',
  media_baja: 'Media-baja',
  en_revision: 'En revisión',
};

const PRIORIDAD_COLORS = {
  vip: { bg: 'rgba(184,134,11,.15)', text: '#8A6D0B' },
  alta: { bg: 'rgba(21,128,61,.12)', text: '#15803D' },
  media_baja: { bg: 'rgba(202,138,4,.15)', text: '#CA8A04' },
  en_revision: { bg: 'rgba(107,107,107,.12)', text: '#6B6B6B' },
};

const LANDING_LABELS = Object.fromEntries(LANDINGS.map((l) => [l.id, l.nombre]));

function Badge({ label, color }) {
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
      {label}
    </span>
  );
}

function EstadoBadge({ estado }) {
  return <Badge label={ESTADO_LABELS[estado] ?? estado} color={ESTADO_COLORS[estado] ?? ESTADO_COLORS.descalificado} />;
}

function PrioridadBadge({ prioridad }) {
  if (!prioridad) return <span style={{ color: '#9A9A9A', fontSize: 12 }}>—</span>;
  return (
    <Badge
      label={PRIORIDAD_LABELS[prioridad] ?? prioridad}
      color={PRIORIDAD_COLORS[prioridad] ?? PRIORIDAD_COLORS.en_revision}
    />
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

const selectStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  fontSize: 12,
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

function Dashboard() {
  const { token, usuario, logout } = useAuth();
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [leadSeleccionadoId, setLeadSeleccionadoId] = useState(null);
  const [filtroLanding, setFiltroLanding] = useState('');

  const loadLeads = useCallback(() => {
    setStatus('loading');
    setError('');
    return getLeads(token, filtroLanding || undefined)
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
  }, [token, logout, filtroLanding]);

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
            Leads
          </h1>
          {usuario?.nombre && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6B6B6B' }}>Hola, {usuario.nombre}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/crm/dashboard" style={navLinkStyle}>
            Ver dashboard
          </Link>
          <Link to="/crm/generador-utm" style={navLinkStyle}>
            Generar URL
          </Link>
          <Link to="/crm/contactos" style={navLinkStyle}>
            Contactos
          </Link>
          <Link to="/crm/pixeles" style={navLinkStyle}>
            Píxeles
          </Link>
          {usuario?.rol === 'admin' && (
            <Link to="/crm/usuarios" style={navLinkStyle}>
              Usuarios
            </Link>
          )}
          <button onClick={logout} style={{ ...navLinkStyle, cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {location.state?.mensaje && (
        <p
          style={{
            margin: '0 0 20px',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(220,53,69,.08)',
            color: '#DC3545',
            fontSize: 13,
          }}
        >
          {location.state.mensaje}
        </p>
      )}

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

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando leads…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
          <button
            onClick={loadLeads}
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

      {status === 'ready' && leads.length === 0 && (
        <p style={{ color: '#6B6B6B' }}>Todavía no hay leads registrados.</p>
      )}

      {status === 'ready' && leads.length > 0 && (
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
                <th style={thStyle}>Landing</th>
                <th style={thStyle}>Prioridad</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Cambiar estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={tdStyle}>
                    <button
                      onClick={() => setLeadSeleccionadoId(lead.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#714B67',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: "'Source Sans 3', system-ui, sans-serif",
                      }}
                    >
                      {lead.nombre}
                    </button>
                  </td>
                  <td style={tdStyle}>{lead.email}</td>
                  <td style={tdStyle}>{lead.telefono}</td>
                  <td style={tdStyle}>{LANDING_LABELS[lead.landing] ?? lead.landing}</td>
                  <td style={tdStyle}>
                    <PrioridadBadge prioridad={lead.prioridad} />
                  </td>
                  <td style={tdStyle}>
                    <EstadoBadge estado={lead.estado} />
                  </td>
                  <td style={tdStyle}>{formatFecha(lead.created_at)}</td>
                  <td style={tdStyle}>
                    {lead.estado === 'descalificado' ? (
                      <span style={{ color: '#9A9A9A', fontSize: 12 }}>—</span>
                    ) : (
                      <>
                        <select
                          className="crm-select"
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
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#DC3545' }}>
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

      {leadSeleccionadoId && (
        <LeadDetalle
          leadId={leadSeleccionadoId}
          onClose={() => setLeadSeleccionadoId(null)}
          onLeadUpdated={(updated) =>
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
          }
        />
      )}
    </div>
  );
}

export default function CRM() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Login />;
}
