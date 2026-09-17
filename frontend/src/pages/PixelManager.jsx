import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getPixelsAdmin, upsertPixel, togglePixel, deletePixel } from '../services/api.js';
import { LANDINGS } from '../utils/landings.js';
import Login from './Login.jsx';
import '../styles/crm.css';

const TIPOS = [
  { value: 'meta_pixel', label: 'Meta Pixel' },
  { value: 'linkedin_insight', label: 'LinkedIn Insight Tag' },
  { value: 'google_analytics', label: 'Google Analytics' },
  { value: 'custom_script', label: 'Script personalizado' },
];

const TIPO_LABELS = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

const cardStyle = {
  background: '#fff',
  border: '1px solid #E4E4E7',
  borderRadius: 10,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
  padding: '20px 22px',
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

const inputStyle = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  fontSize: 13,
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const btnPrimary = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  background: '#714B67',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 12,
};

function PixelRow({ pixel, token, onReload }) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await togglePixel(token, pixel.id, !pixel.activo);
      onReload();
    } catch {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar ${TIPO_LABELS[pixel.tipo] || pixel.tipo} de ${pixel.landing}?`)) return;
    try {
      await deletePixel(token, pixel.id);
      onReload();
    } catch {
      // ignore
    }
  }

  return (
    <tr>
      <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F1' }}>
        {pixel.landing}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F1' }}>
        {TIPO_LABELS[pixel.tipo] || pixel.tipo}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F1', fontFamily: 'monospace' }}>
        {pixel.pixel_id}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F1' }}>
        <button
          onClick={handleToggle}
          disabled={toggling}
          style={{
            ...btnPrimary,
            background: pixel.activo ? '#DC3545' : '#15803D',
            fontSize: 11,
            padding: '4px 12px',
          }}
        >
          {pixel.activo ? 'Desactivar' : 'Activar'}
        </button>
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F1' }}>
        <button
          onClick={handleDelete}
          style={{ ...btnPrimary, background: '#6B6B6B', fontSize: 11, padding: '4px 12px' }}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
}

function PixelManagerView() {
  const { token, logout } = useAuth();
  const [pixels, setPixels] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const [formLanding, setFormLanding] = useState(LANDINGS[0]?.id || '');
  const [formTipo, setFormTipo] = useState(TIPOS[0].value);
  const [formPixelId, setFormPixelId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus('loading');
    setError('');
    getPixelsAdmin(token)
      .then((data) => {
        setPixels(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.status === 401) { logout(); return; }
        setError(err.message);
        setStatus('error');
      });
  }, [token, logout]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!formPixelId.trim()) return;
    setSaving(true);
    try {
      await upsertPixel(token, { landing: formLanding, tipo: formTipo, pixel_id: formPixelId.trim() });
      setFormPixelId('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F9', color: '#1F1F1F', fontFamily: "'Source Sans 3', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#714B67' }}>CRM Macondo</p>
          <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22 }}>Administrador de Píxeles</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/crm" style={navLinkStyle}>Ver leads</Link>
          <Link to="/crm/dashboard" style={navLinkStyle}>Dashboard</Link>
          <button onClick={logout} style={{ ...navLinkStyle, cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
      </div>

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando píxeles…</p>}
      {status === 'error' && <p style={{ color: '#DC3545' }}>{error}</p>}

      {status === 'ready' && (
        <>
          {/* Formulario para agregar/editar */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14 }}>Agregar píxel</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 }}>Landing</label>
                <select value={formLanding} onChange={(e) => setFormLanding(e.target.value)} style={inputStyle}>
                  {LANDINGS.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 }}>Tipo</label>
                <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} style={inputStyle}>
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4 }}>ID / Código</label>
                <input value={formPixelId} onChange={(e) => setFormPixelId(e.target.value)} placeholder="Ej: 3042201516085954" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <button onClick={handleSave} disabled={saving || !formPixelId.trim()} style={{ ...btnPrimary, opacity: saving || !formPixelId.trim() ? 0.5 : 1 }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Tabla de píxeles */}
          <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
            {pixels.length === 0 ? (
              <p style={{ padding: '20px 22px', color: '#6B6B6B' }}>No hay píxeles configurados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B6B6B', borderBottom: '1px solid #E4E4E7' }}>Landing</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B6B6B', borderBottom: '1px solid #E4E4E7' }}>Tipo</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B6B6B', borderBottom: '1px solid #E4E4E7' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B6B6B', borderBottom: '1px solid #E4E4E7' }}>Estado</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B6B6B', borderBottom: '1px solid #E4E4E7' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pixels.map((p) => (
                    <PixelRow key={p.id} pixel={p} token={token} onReload={load} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PixelManager() {
  const { token } = useAuth();
  return token ? <PixelManagerView /> : <Login />;
}
