import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import LandingVSL from './pages/LandingVSL.jsx';
import FormVSL from './pages/FormVSL.jsx';
import GraciasVSL from './pages/GraciasVSL.jsx';
import './index.css';

function StripTrailingSlash() {
  const { pathname, search } = useLocation();
  if (pathname !== '/' && pathname.endsWith('/')) {
    return <Navigate to={pathname.slice(0, -1) + search} replace />;
  }
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StripTrailingSlash />
      <Routes>
        <Route path="/vsl" element={<LandingVSL />} />
        <Route path="/formvsl" element={<FormVSL />} />
        <Route path="/graciasvsl" element={<GraciasVSL />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
