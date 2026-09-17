import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import LandingVSL from './pages/LandingVSL.jsx';
import LandingLp1 from './pages/LandingLp1.jsx';
import FormVSL from './pages/FormVSL.jsx';
import FormLp1 from './pages/FormLp1.jsx';
import GraciasVSL from './pages/GraciasVSL.jsx';
import GraciasLp1 from './pages/GraciasLp1.jsx';
import CRM from './pages/CRM.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Usuarios from './pages/Usuarios.jsx';
import GeneradorUTM from './pages/GeneradorUTM.jsx';
import LeadDetalle from './pages/LeadDetalle.jsx';
import Contactos from './pages/Contactos.jsx';
import PixelManager from './pages/PixelManager.jsx';
import LandingList from './pages/LandingList.jsx';
import LandingBuilder from './pages/LandingBuilder.jsx';
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
        <Route path="/" element={<Navigate to="/vsl" replace />} />
        <Route path="/vsl" element={<LandingVSL />} />
        <Route path="/formvsl" element={<FormVSL />} />
        <Route path="/graciasvsl" element={<GraciasVSL />} />
        <Route path="/lp1" element={<LandingLp1 />} />
        <Route path="/lp1/form" element={<FormLp1 />} />
        <Route path="/lp1/gracias" element={<GraciasLp1 />} />
        <Route element={<CrmLayout />}>
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/dashboard" element={<Dashboard />} />
          <Route path="/crm/usuarios" element={<Usuarios />} />
          <Route path="/crm/generador-utm" element={<GeneradorUTM />} />
          <Route path="/crm/contactos" element={<Contactos />} />
          <Route path="/crm/pixeles" element={<PixelManager />} />
          <Route path="/crm/landings" element={<LandingList />} />
          <Route path="/crm/landings/new" element={<LandingBuilder />} />
          <Route path="/crm/landings/:id/edit" element={<LandingBuilder />} />
          <Route path="/crm/leads/:id" element={<LeadDetalleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Registro de landings disponibles. Agregar una entrada aquí cada vez que
// se crea una landing nueva (debe coincidir con el mapa LANDINGS en
// backend/src/controllers/utm.controller.js).
export const LANDINGS = [
  { id: 'vsl-macondo', nombre: 'VSL Macondo (Cloud)', ruta: '/vsl' },
  { id: 'lp1', nombre: 'Cloud Savings (LatAm)', ruta: '/lp1' },
];
