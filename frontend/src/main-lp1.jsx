import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import LandingLp1 from './pages/LandingLp1.jsx';
import FormPage from './pages/FormLp1.jsx';
import Gracias from './pages/GraciasLp1.jsx';
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
    <BrowserRouter basename="/lp1">
      <StripTrailingSlash />
      <Routes>
        <Route path="/" element={<LandingLp1 />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/gracias" element={<Gracias />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
