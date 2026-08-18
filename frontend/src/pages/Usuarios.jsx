import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario } from '../services/api.js';
import Login from './Login.jsx';
import '../styles/crm.css';

const ROLES = ['admin', 'vendedor'];
const ROL_LABELS = { admin: 'Admin', vendedor: 'Vendedor' };

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

function NuevoUsuarioForm({ token, onCreated }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || password.length < 8) return;

    setStatus('loading');
    setError('');
    createUsuario(token, { nombre: nombre.trim(), email: email.trim(), password, rol })
      .then((nuevo) => {
        onCreated(nuevo);
        setNombre('');
        setEmail('');
        setPassword('');
        setRol('vendedor');
        setStatus('idle');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }

  return (
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        alignItems: 'end',
      }}
    >
      <div>
        <label style={labelStyle}>Nombre</label>
        <input className="crm-input" style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          className="crm-input"
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>Password (min. 8)</label>
        <input
          type="password"
          className="crm-input"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label style={labelStyle}>Rol</label>
        <select
          className="crm-select"
          style={{ ...inputStyle, padding: '10px 12px' }}
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROL_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            padding: '11px 20px',
            borderRadius: 6,
            border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
            background: status === 'loading' ? '#B79AB1' : '#714B67',
            color: '#fff',
            cursor: status === 'loading' ? 'default' : 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          {status === 'loading' ? 'Creando…' : 'Crear usuario'}
        </button>
      </div>
      {status === 'error' && (
        <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 12, color: '#DC3545' }}>{error}</p>
      )}
    </form>
  );
}

function UsuariosView() {
  const { token, usuario, logout } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [rowBusyId, setRowBusyId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  const loadUsuarios = useCallback(() => {
    setStatus('loading');
    setError('');
    return getUsuarios(token)
      .then((data) => {
        setUsuarios(data);
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
    loadUsuarios();
  }, [loadUsuarios]);

  function handleRolChange(id, rol) {
    setRowBusyId(id);
    setRowErrors((prev) => ({ ...prev, [id]: '' }));

    updateUsuario(token, id, { rol })
      .then((updated) => {
        setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setRowErrors((prev) => ({ ...prev, [id]: err.message }));
      })
      .finally(() => setRowBusyId(null));
  }

  function handleDelete(id) {
    setRowBusyId(id);
    setRowErrors((prev) => ({ ...prev, [id]: '' }));

    deleteUsuario(token, id)
      .then(() => {
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setRowErrors((prev) => ({ ...prev, [id]: err.message }));
      })
      .finally(() => setRowBusyId(null));
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
            Usuarios
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

      <NuevoUsuarioForm token={token} onCreated={(nuevo) => setUsuarios((prev) => [{ ...nuevo, created_at: new Date().toISOString() }, ...prev])} />

      {status === 'loading' && <p style={{ color: '#6B6B6B' }}>Cargando usuarios…</p>}

      {status === 'error' && (
        <div>
          <p style={{ color: '#DC3545', marginBottom: 12 }}>{error}</p>
          <button
            onClick={loadUsuarios}
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

      {status === 'ready' && (
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
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>
                    {u.nombre}
                    {u.id === usuario?.id && (
                      <span style={{ color: '#9A9A9A', fontSize: 11, marginLeft: 6 }}>(tú)</span>
                    )}
                  </td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <select
                      className="crm-select"
                      value={u.rol}
                      onChange={(e) => handleRolChange(u.id, e.target.value)}
                      disabled={rowBusyId === u.id}
                      style={selectStyle}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROL_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={rowBusyId === u.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid rgba(220,53,69,.4)',
                        background: '#fff',
                        color: '#DC3545',
                        cursor: rowBusyId === u.id ? 'default' : 'pointer',
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {rowBusyId === u.id ? 'Procesando…' : 'Eliminar'}
                    </button>
                    {rowErrors[u.id] && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#DC3545' }}>{rowErrors[u.id]}</p>
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

export default function Usuarios() {
  const { token, usuario } = useAuth();

  if (!token) return <Login />;

  if (usuario?.rol !== 'admin') {
    return (
      <Navigate to="/crm" replace state={{ mensaje: 'No tienes acceso a la sección de usuarios.' }} />
    );
  }

  return <UsuariosView />;
}
