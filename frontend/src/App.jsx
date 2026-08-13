import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingVSL from './pages/LandingVSL.jsx';
import CRM from './pages/CRM.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingVSL />} />
        <Route
          path="/crm"
          element={
            <AuthProvider>
              <CRM />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
