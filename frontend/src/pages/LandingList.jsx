import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getLandings, deleteLanding, updateLandingStatus } from '../services/api.js';
import Login from './Login.jsx';
import '../styles/crm.css';

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

const btnDanger = {
  ...btnPrimary,
  background: '#DC2626',
};

const btnSecondary = {
  ...btnPrimary,
  background: '#fff',
  color: '#1F1F1F',
  border: '1px solid #DADADE',
};

const ESTADO_BADGES = {
  borrador: { bg: '#FEF3C7', color: '#92400E', label: 'Borrador' },
  publicada: { bg: '#D1FAE5', color: '#065F46', label: 'Publicada' },
  desactivada: { bg: '#FEE2E2', color: '#991B1B', label: 'Desactivada' },
};

export default function LandingList() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const [landings, setLandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = usuario?.rol === 'admin';

  const load = useCallback(async () => {
    try {
      setError('');
      setLandings(await getLandings(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id, nombre) {
    if (!confirm(`¿Eliminar la landing "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteLanding(token, id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleStatus(landing) {
    const newStatus = landing.estado === 'publicada' ? 'desactivada' : 'publicada';
    const action = newStatus === 'desactivada' ? 'desactivar' : 'publicar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${landing.nombre}"?`)) return;
    try {
      await updateLandingStatus(token, landing.id, newStatus);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!token) return <Login />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, margin: 0 }}>
          Landings del Builder
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/crm" style={navLinkStyle}>← CRM</Link>
          <Link to="/crm/landings/new" style={btnPrimary}>+ Nueva Landing</Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', borderRadius: 8, color: '#991B1B', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        {loading ? (
          <p style={{ color: '#666', fontSize: 14 }}>Cargando...</p>
        ) : landings.length === 0 ? (
          <p style={{ color: '#666', fontSize: 14 }}>
            No hay landings del builder todavía.{' '}
            <Link to="/crm/landings/new" style={{ color: '#714B67' }}>Crear la primera</Link>
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E4E4E7', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Nombre</th>
                <th style={{ padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Slug</th>
                <th style={{ padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Estado</th>
                <th style={{ padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Actualizada</th>
                <th style={{ padding: '8px 12px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="crm-table">
              {landings.map((l) => {
                const badge = ESTADO_BADGES[l.estado] || ESTADO_BADGES.borrador;
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F4F4F5' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{l.nombre}</td>
                    <td style={{ padding: '10px 12px', color: '#666', fontFamily: 'monospace', fontSize: 13 }}>
                      /{l.slug}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#666', fontSize: 13 }}>
                      {new Date(l.updated_at).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/crm/landings/${l.id}/edit`} style={{ ...btnSecondary, fontSize: 11, padding: '4px 10px' }}>
                          Editar
                        </Link>
                        {isAdmin && l.estado === 'borrador' && (
                          <button
                            onClick={() => handleToggleStatus(l)}
                            style={{ ...btnPrimary, fontSize: 11, padding: '4px 10px', background: '#059669' }}
                          >
                            Publicar
                          </button>
                        )}
                        {isAdmin && l.estado === 'publicada' && (
                          <button
                            onClick={() => handleToggleStatus(l)}
                            style={{ ...btnDanger, fontSize: 11, padding: '4px 10px' }}
                          >
                            Desactivar
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(l.id, l.nombre)}
                            style={{ ...btnDanger, fontSize: 11, padding: '4px 10px', background: '#fff', color: '#DC2626', border: '1px solid #DC2626' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
