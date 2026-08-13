import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import LandingVSL from './pages/LandingVSL.jsx';
import CRM from './pages/CRM.jsx';
import Dashboard from './pages/Dashboard.jsx';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingVSL />} />
        <Route element={<CrmLayout />}>
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
