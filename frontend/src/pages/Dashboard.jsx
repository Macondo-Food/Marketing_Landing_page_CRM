import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCampanas, getDashboard } from '../services/api.js';
import { LANDINGS } from '../utils/landings.js';
import Login from './Login.jsx';
import '../styles/crm.css';

// Mismo orden y texto que las preguntas del quiz (QuizPopup.jsx).
const QUESTION_ORDER = ['inversion_nube', 'proveedor_nube', 'cargo', 'industria'];
const QUESTION_LABELS = {
  inversion_nube: '¿Cuál es tu inversión mensual en infraestructura de nube?',
  proveedor_nube: '¿Cuál es tu proveedor de nube principal?',
  cargo: '¿Cuál es tu cargo en la organización?',
  industria: '¿Cuál es tu sector / industria?',
};

const cardStyle = {
  background: '#fff',
  border: '1px solid #E4E4E7',
  borderRadius: 10,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
  padding: '20px 22px',
};

const eyebrowStyle = {
  margin: '0 0 4px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
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

function StatTile({ label, value }) {
  return (
    <div style={cardStyle}>
      <p style={eyebrowStyle}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 30, color: '#1F1F1F' }}>
        {value}
      </p>
    </div>
  );
}

function AnswerBar({ respuesta, total, porcentaje }) {
  return (
    <div style={{ marginBottom: 14 }} title={`${total} de las respuestas a esta pregunta`}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
          fontSize: 13,
          color: '#1F1F1F',
        }}
      >
        <span>{respuesta}</span>
        <span style={{ color: '#6B6B6B', whiteSpace: 'nowrap' }}>
          {porcentaje}% &middot; {total}
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: '#F0F0F1',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${porcentaje}%`,
            minWidth: porcentaje > 0 ? 4 : 0,
            borderRadius: 999,
            background: '#714B67',
          }}
        />
      </div>
    </div>
  );
}

function QuestionCard({ pregunta, answers }) {
  return (
    <div style={cardStyle}>
      <h3
        style={{
          margin: '0 0 18px',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1.4,
          color: '#1F1F1F',
        }}
      >
        {QUESTION_LABELS[pregunta] ?? pregunta}
      </h3>
      {answers.map((a) => (
        <AnswerBar key={a.respuesta} {...a} />
      ))}
    </div>
  );
}

function CampanasTable({ campanas }) {
  if (campanas.length === 0) {
    return <p style={{ color: '#6B6B6B' }}>Todavía no hay leads con datos de campaña.</p>;
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
    borderBottom: '1px solid #E4E4E7',
  };

  const tdStyle = {
    padding: '10px 14px',
    fontSize: 13,
    color: '#1F1F1F',
    borderBottom: '1px solid #F0F0F1',
  };

  return (
    <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Campaña</th>
            <th style={thStyle}>Leads</th>
            <th style={thStyle}>Calificados</th>
            <th style={thStyle}>Agendados</th>
            <th style={thStyle}>% Conversión</th>
          </tr>
        </thead>
        <tbody>
          {campanas.map((c) => (
            <tr key={`${c.utm_source}::${c.utm_campaign}`}>
              <td style={tdStyle}>
                {c.utm_source} / {c.utm_campaign}
              </td>
              <td style={tdStyle}>{c.total}</td>
              <td style={tdStyle}>{c.calificados}</td>
              <td style={tdStyle}>{c.agendados}</td>
              <td style={tdStyle}>{c.porcentajeConversion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardView() {
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [campanas, setCampanas] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [filtroLanding, setFiltroLanding] = useState('');

  const load = useCallback(() => {
    setStatus('loading');
    setError('');
    const landingArg = filtroLanding || undefined;
    return Promise.all([getDashboard(token, landingArg), getCampanas(token, landingArg)])
      .then(([dashboardResult, campanasResult]) => {
        setData(dashboardResult);
        setCampanas(campanasResult.campanas);
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
    load();
  }, [load]);

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
            Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/crm" style={navLinkStyle}>
            Ver leads
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

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando dashboard…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
          <button
            onClick={load}
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

      {status === 'ready' && data && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 14,
              marginBottom: 28,
            }}
          >
            <StatTile label="Total leads" value={data.resumen.totalLeads} />
            <StatTile label="% Calificados" value={`${data.resumen.porcentajeCalificados}%`} />
            <StatTile label="% Agendados o más" value={`${data.resumen.porcentajeAgendadosOSuperior}%`} />
          </div>

          {data.resumen.totalLeads === 0 ? (
            <p style={{ color: '#6B6B6B' }}>Todavía no hay leads registrados.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 16,
              }}
            >
              {QUESTION_ORDER.filter((q) => data.respuestas[q]?.length).map((pregunta) => (
                <QuestionCard key={pregunta} pregunta={pregunta} answers={data.respuestas[pregunta]} />
              ))}
            </div>
          )}

          <h2
            style={{
              margin: '32px 0 14px',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 16,
              color: '#1F1F1F',
            }}
          >
            Rendimiento por campaña
          </h2>
          <CampanasTable campanas={campanas} />
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  return token ? <DashboardView /> : <Login />;
}
