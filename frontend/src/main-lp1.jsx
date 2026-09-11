import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingLp1 from './pages/LandingLp1.jsx';
import FormPage from './pages/FormPage.jsx';
import Gracias from './pages/Gracias.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/lp1">
      <Routes>
        <Route path="/" element={<LandingLp1 />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/gracias" element={<Gracias />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
