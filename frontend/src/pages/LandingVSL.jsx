import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import VideoSection from '../components/VideoSection.jsx';
import ClientsSection from '../components/ClientsSection.jsx';
import Footer from '../components/Footer.jsx';
import { captureUtms } from '../utils/utm.js';
import { loadMarketingPixels } from '../utils/marketingPixels.js';

export default function LandingVSL() {
  const navigate = useNavigate();
  // Una vez Vturb revela el señuelo (ver decoyRef más abajo), el botón
  // "Reservar mi llamada" queda visible para siempre.
  const [hasRevealed, setHasRevealed] = useState(false);
  const decoyRef = useRef(null);

  useEffect(() => {
    captureUtms();
    // Meta Pixel + LinkedIn Insight Tag: solo en la landing pública, nunca
    // en /crm (ver marketingPixels.js).
    loadMarketingPixels('vsl-macondo');
  }, []);

  // El panel de Vturb está configurado para revelar el elemento con id
  // "abrir-formulario-vsl" entre el minuto 8:15 y 9:35 del video. Se
  // confirmó en vivo que Vturb hace esto manipulando el estilo inline del
  // nodo directamente (`element.style.setProperty('display', ..., 'important')`,
  // primero para ocultarlo al cargar la página y luego para revelarlo) —
  // por eso el señuelo es un <div> aparte, vacío y sin tamaño (línea de
  // abajo en el JSX), nunca el popup real: si Vturb manipulara el mismo
  // nodo que renderiza el popup, su `display: ... !important` inline le
  // gana en especificidad a cualquier clase CSS nuestra, y ya se vio
  // romper el centrado (quedaba en `display: block` en vez de `flex`).
  // Este observer solo traduce esa señal a estado de React una única vez;
  // a partir de ahí el popup queda 100% controlado por React.
  //
  // Ojo: no se hace ningún chequeo "por si ya estaba revelado" al montar
  // el observer — el script de Vturb carga async (ver VturbPlayer.jsx) y
  // todavía no alcanzó a aplicar su `display: none` cuando este efecto
  // corre, así que el <div> se ve con su `display` por defecto (`block`,
  // no seteado por nosotros a propósito, ver más abajo) y un chequeo
  // inmediato lo interpretaría como "ya revelado", abriendo el popup solo
  // al cargar la página. Confirmado en vivo: rompía exactamente así.
  useEffect(() => {
    const decoy = decoyRef.current;
    if (!decoy) return;

    const observer = new MutationObserver(() => {
      if (getComputedStyle(decoy).display === 'none') return;
      setHasRevealed(true);
      observer.disconnect();
    });
    observer.observe(decoy, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Header />
      <Hero />
      <VideoSection
        onFormClick={() => navigate('/formvsl')}
        showReserveButton={hasRevealed}
      />
      <ClientsSection />
      <Footer />
      {/* Señuelo para el panel de Vturb: no es visible ni se renderiza con
          contenido propio, solo existe para que el CTA configurado en Vturb
          tenga un id real que revelar en el minuto 8:15-9:35 (ver el efecto
          de arriba). Al revelarse, muestra el botón "Reservar mi llamada"
          que navega a /form. */}
      <div
        id="abrir-formulario-vsl"
        ref={decoyRef}
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden' }}
      />
    </div>
  );
}
