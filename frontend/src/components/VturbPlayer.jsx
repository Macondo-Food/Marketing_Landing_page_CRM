// Placeholder hasta que llegue el código de embed real en reference/vturb-embed.txt.
// Cuando exista ese código, este componente se reemplaza sin tocar el resto de la landing.
// El clic dispara el popup del quiz de calificación (ver LandingVSL.jsx).
export default function VturbPlayer({ onClick }) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Reproducir video"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#0C0C0C',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          border: '2px solid #F8F522',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            marginLeft: 6,
            borderTop: '14px solid transparent',
            borderBottom: '14px solid transparent',
            borderLeft: '22px solid #F8F522',
          }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: '#8A8A8A',
        }}
      >
        Video pendiente de integración (Vturb)
      </p>
    </div>
  );
}
