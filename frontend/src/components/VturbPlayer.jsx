import { useEffect } from 'react';

// Embed real de Vturb (Converte AI). El <script> del snippet original crea
// dinámicamente otro <script> y lo agrega a <head> — se replica esa misma
// lógica acá con document.createElement en vez de pegar un <script> literal
// en el JSX (React no lo ejecutaría). Se evita duplicar el <script> si el
// componente se vuelve a montar (ej. Fast Refresh en desarrollo).
const PLAYER_SCRIPT_SRC =
  'https://scripts.converteai.net/4fe20c2b-9840-4bf1-bc41-73e3d2c46b5a/players/6a8cd7ce205ee703bdef6eac/v4/player.js';

// Sin ningún listener de clic propio sobre el área del video: este div solo
// posiciona el player real de Vturb. Un onClick/onClickCapture aquí captura
// TODOS los clics dentro del área (incluyendo los controles nativos de
// play/pausa de Vturb, no solo un CTA), abriendo el popup indiscriminadamente
// — bug confirmado en producción. La apertura manual (solo para pruebas en
// desarrollo) vive en el botón dev-only de VideoSection.jsx, fuera de esta
// área, nunca superpuesto al player.
export default function VturbPlayer() {
  useEffect(() => {
    if (document.querySelector(`script[src="${PLAYER_SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = PLAYER_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <vturb-smartplayer
        id="vid-6a8cd7ce205ee703bdef6eac"
        style={{ display: 'block', margin: '0 auto', width: '100%' }}
      >
        <div
          className="vturb-player-placeholder"
          style={{ position: 'relative', width: '100%', padding: '56.25% 0 0', zIndex: 0, backgroundColor: 'black' }}
        />
      </vturb-smartplayer>
    </div>
  );
}
