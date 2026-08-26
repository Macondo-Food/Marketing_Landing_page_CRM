import { useEffect } from 'react';

// Embed real de Vturb (Converte AI). El <script> del snippet original crea
// dinámicamente otro <script> y lo agrega a <head> — se replica esa misma
// lógica acá con document.createElement en vez de pegar un <script> literal
// en el JSX (React no lo ejecutaría). Se evita duplicar el <script> si el
// componente se vuelve a montar (ej. Fast Refresh en desarrollo).
const PLAYER_SCRIPT_SRC =
  'https://scripts.converteai.net/4fe20c2b-9840-4bf1-bc41-73e3d2c46b5a/players/6a8cd7ce205ee703bdef6eac/v4/player.js';

// El clic sobre el área del video sigue abriendo nuestro popup del quiz
// (ver LandingVSL.jsx) como control manual, independiente de la revelación
// automática por el señuelo Vturb (ver id="abrir-formulario-vsl" en
// LandingVSL.jsx).
export default function VturbPlayer({ onClick }) {
  useEffect(() => {
    if (document.querySelector(`script[src="${PLAYER_SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = PLAYER_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div
      // onClickCapture (no onClick): el elemento real <vturb-smartplayer>
      // maneja sus propios clics internamente y detiene la propagación antes
      // de que llegue a un onClick normal (fase de burbuja) en este div —
      // confirmado en vivo, el clic no abría el popup. La fase de captura
      // se dispara antes que el player pueda detenerla.
      onClickCapture={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Reproducir video"
      style={{ position: 'absolute', inset: 0 }}
    >
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
