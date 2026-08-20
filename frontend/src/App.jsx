import { BrowserRouter, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import LandingVSL from './pages/LandingVSL.jsx';
import CRM from './pages/CRM.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Usuarios from './pages/Usuarios.jsx';
import GeneradorUTM from './pages/GeneradorUTM.jsx';
import LeadDetalle from './pages/LeadDetalle.jsx';
import Contactos from './pages/Contactos.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// /crm y /crm/dashboard comparten el mismo AuthProvider (token en memoria)
// para no perder la sesión al navegar entre las dos.
function CrmLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Fallback para acceso directo a /crm/leads/:id (link compartido, recarga de
// página, etc.) — el uso normal es el modal que abre CRM.jsx sobre la tabla,
// sin cambiar la URL. Aquí solo se traduce el :id de la URL a props y, al
// cerrar, se vuelve a /crm.
function LeadDetalleRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <LeadDetalle leadId={Number(id)} onClose={() => navigate('/crm')} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingVSL />} />
        <Route element={<CrmLayout />}>
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/dashboard" element={<Dashboard />} />
          <Route path="/crm/usuarios" element={<Usuarios />} />
          <Route path="/crm/generador-utm" element={<GeneradorUTM />} />
          <Route path="/crm/contactos" element={<Contactos />} />
          <Route path="/crm/leads/:id" element={<LeadDetalleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
