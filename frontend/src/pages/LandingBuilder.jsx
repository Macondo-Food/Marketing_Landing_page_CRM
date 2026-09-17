import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getLanding, createLanding, updateLanding, publishLanding, checkSlugAvailable,
} from '../services/api.js';
import Login from './Login.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3099';

const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: '#fff',
  borderBottom: '1px solid #E4E4E7',
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const inputStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #DADADE',
  fontSize: 13,
  fontFamily: "'Source Sans 3', system-ui, sans-serif",
};

const btnPrimary = {
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  background: '#714B67',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 12,
};

const btnSecondary = {
  ...btnPrimary,
  background: '#fff',
  color: '#1F1F1F',
  border: '1px solid #DADADE',
};

const btnSuccess = {
  ...btnPrimary,
  background: '#059669',
};

const deviceBtnBase = {
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #DADADE',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: "'Source Sans 3', sans-serif",
};

export default function LandingBuilder() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const isAdmin = usuario?.rol === 'admin';

  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const savingRef = useRef(false);

  const [landing, setLanding] = useState(null);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('ok');
  const [activeDevice, setActiveDevice] = useState('Desktop');

  function showMsg(text, type = 'ok') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  }

  // Cargar landing existente
  const loadLanding = useCallback(async () => {
    try {
      const data = await getLanding(token, id);
      setLanding(data);
      setNombre(data.nombre);
      setSlug(data.slug);
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (!isNew) loadLanding();
  }, [isNew, loadLanding]);

  // Inicializar GrapesJS cuando el contenedor y los datos estén listos
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    if (!isNew && !landing) return;

    let cancelled = false;

    async function initGrapesJS() {
      const { initEditor } = await import('../builder/index.js');
      if (cancelled || !containerRef.current) return;

      const editor = initEditor(containerRef.current, {
        projectData: landing?.editor_json,
        assetManagerUrl: landing ? `${API_URL}/landings/${landing.id}/assets` : '',
        authToken: token,
      });

      editorRef.current = editor;
    }

    initGrapesJS();
    return () => { cancelled = true; };
  }, [landing, isNew, token]);

  // Crear landing nueva
  async function handleCreate() {
    if (!nombre.trim() || !slug.trim()) {
      showMsg('Nombre y slug son requeridos', 'error');
      return;
    }
    try {
      const { available } = await checkSlugAvailable(token, slug);
      if (!available) {
        showMsg(`El slug "${slug}" ya está en uso`, 'error');
        return;
      }
      const created = await createLanding(token, { nombre: nombre.trim(), slug: slug.trim() });
      navigate(`/crm/landings/${created.id}/edit`, { replace: true });
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }

  // Guardar borrador
  async function handleSave() {
    if (!editorRef.current || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const projectData = JSON.stringify(editorRef.current.getProjectData());
      await updateLanding(token, landing.id, {
        editor_json: projectData,
        nombre: nombre.trim(),
        slug: slug.trim(),
      });
      showMsg('Borrador guardado');
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  // Publicar
  async function handlePublish() {
    if (!editorRef.current || !isAdmin) return;
    if (!confirm('¿Publicar esta landing? Será visible públicamente en /' + slug)) return;
    setPublishing(true);
    try {
      const html = editorRef.current.getHtml();
      const css = editorRef.current.getCss();
      // Guardar el estado del editor primero
      const projectData = JSON.stringify(editorRef.current.getProjectData());
      await updateLanding(token, landing.id, { editor_json: projectData, nombre: nombre.trim(), slug: slug.trim() });
      await publishLanding(token, landing.id, { html, css });
      showMsg('Landing publicada');
    } catch (err) {
      showMsg(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  // Cambio de dispositivo (#9)
  function setDevice(device) {
    if (!editorRef.current) return;
    editorRef.current.setDevice(device);
    setActiveDevice(device);
  }

  if (!token) return <Login />;

  if (isNew) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 16px', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
        <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 10, padding: '32px 28px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, marginTop: 0 }}>
            Nueva Landing
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Campaña Verano 2026"
                style={{ ...inputStyle, display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Slug (URL)
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ color: '#666', fontSize: 13 }}>/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="campana-verano-2026"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </label>
          </div>
          {msg && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 13,
              background: msgType === 'error' ? '#FEE2E2' : '#D1FAE5',
              color: msgType === 'error' ? '#991B1B' : '#065F46',
            }}>
              {msg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <Link to="/crm/landings" style={{ ...btnSecondary, textDecoration: 'none' }}>Cancelar</Link>
            <button onClick={handleCreate} style={btnPrimary}>Crear y Editar</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: '#666', fontFamily: "'Source Sans 3', sans-serif" }}>
        Cargando editor...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f4f5' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <Link to="/crm/landings" style={{ ...btnSecondary, textDecoration: 'none', fontSize: 11 }}>
          ← Landings
        </Link>
        <div style={{ width: 1, height: 20, background: '#E4E4E7' }} />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ ...inputStyle, fontWeight: 600, width: 180 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, color: '#666' }}>
          <span>/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            style={{ ...inputStyle, width: 140, fontSize: 12 }}
          />
        </div>
        <div style={{ flex: 1 }} />

        {/* Device toggle (#9) */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['Desktop', 'Tablet', 'Mobile'].map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d === 'Mobile' ? 'Mobile portrait' : d)}
              style={{
                ...deviceBtnBase,
                background: activeDevice === d ? '#714B67' : '#fff',
                color: activeDevice === d ? '#fff' : '#1F1F1F',
                borderColor: activeDevice === d ? '#714B67' : '#DADADE',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#E4E4E7' }} />

        <button onClick={handleSave} disabled={saving} style={{ ...btnSecondary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        {isAdmin && (
          <button onClick={handlePublish} disabled={publishing} style={{ ...btnSuccess, opacity: publishing ? 0.6 : 1 }}>
            {publishing ? 'Publicando...' : 'Publicar'}
          </button>
        )}
      </div>

      {/* Status message */}
      {msg && (
        <div style={{
          padding: '8px 16px', fontSize: 13, textAlign: 'center',
          background: msgType === 'error' ? '#FEE2E2' : '#D1FAE5',
          color: msgType === 'error' ? '#991B1B' : '#065F46',
        }}>
          {msg}
        </div>
      )}

      {/* GrapesJS container */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
}
