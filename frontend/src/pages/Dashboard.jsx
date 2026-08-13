import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboard } from '../services/api.js';
import Login from './Login.jsx';

// Mismo orden y texto que las preguntas del quiz (QuizPopup.jsx).
const QUESTION_ORDER = ['inversion_nube', 'proveedor_nube', 'cargo', 'industria'];
const QUESTION_LABELS = {
  inversion_nube: '¿Cuál es tu inversión mensual en infraestructura de nube?',
  proveedor_nube: '¿Cuál es tu proveedor de nube principal?',
  cargo: '¿Cuál es tu cargo en la organización?',
  industria: '¿Cuál es tu sector / industria?',
};

const cardStyle = {
  background: '#0C0C0C',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 12,
  padding: '20px 22px',
};

const eyebrowStyle = {
  margin: '0 0 4px',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: '#B4B4B4',
};

function StatTile({ label, value }) {
  return (
    <div style={cardStyle}>
      <p style={eyebrowStyle}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 30 }}>
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
          color: '#fff',
        }}
      >
        <span>{respuesta}</span>
        <span style={{ color: '#B4B4B4', whiteSpace: 'nowrap' }}>
          {porcentaje}% &middot; {total}
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: 'rgba(255,255,255,.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${porcentaje}%`,
            minWidth: porcentaje > 0 ? 4 : 0,
            borderRadius: 999,
            background: '#F8F522',
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

function DashboardView() {
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setStatus('loading');
    setError('');
    return getDashboard(token)
      .then((result) => {
        setData(result);
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
    load();
  }, [load]);

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
            Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to="/crm"
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
            Ver leads
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

      {status === 'loading' && <p style={{ color: '#B4B4B4' }}>Cargando dashboard…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#FF6B6B', marginBottom: 12 }}>{error}</p>
          <button
            onClick={load}
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
            <p style={{ color: '#B4B4B4' }}>Todavía no hay leads registrados.</p>
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
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  return token ? <DashboardView /> : <Login />;
}
