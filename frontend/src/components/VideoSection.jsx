import VturbPlayer from './VturbPlayer.jsx';

const reserveButtonStyle = {
  padding: '14px 32px',
  borderRadius: 999,
  border: 'none',
  background: '#F8F522',
  color: '#000',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const devButtonStyle = {
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px dashed rgba(255,255,255,.4)',
  background: 'transparent',
  color: '#8A8A8A',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

export default function VideoSection({ onPlayClick, showReserveButton, onReserveClick }) {
  return (
    <section style={{ maxWidth: 1020, margin: '0 auto', padding: '44px 24px 0' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid rgba(248,245,34,.35)',
          boxShadow: '0 0 0 6px rgba(248,245,34,.06)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0C0C0C' }}>
          <VturbPlayer />
        </div>
      </div>
      {/* Solo existe en el bundle de desarrollo (import.meta.env.DEV se
          elimina en `vite build` de producción) — sirve para abrir el quiz
          manualmente sin esperar al minuto 8:15 del video mientras se
          prueba. Nunca se superpone al área del player, así que nunca
          intercepta sus controles nativos. */}
      {import.meta.env.DEV && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button onClick={onPlayClick} style={devButtonStyle}>
            Abrir quiz (solo desarrollo)
          </button>
        </div>
      )}
      {showReserveButton && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={onReserveClick} style={reserveButtonStyle}>
            Reservar mi llamada
          </button>
        </div>
      )}
    </section>
  );
}
