export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,.12)', padding: '44px 24px 56px' }}>
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, letterSpacing: '.16em', color: '#F8F522' }}>
          MACONDO MAGIC SOFTWARES
        </p>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 12, letterSpacing: '.16em', color: '#8A8A8A' }}>
          TODOS LOS DERECHOS RESERVADOS
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            fontSize: 12,
            letterSpacing: '.12em',
            color: '#8A8A8A',
          }}
        >
          <a href="#">POLÍTICAS DE PRIVACIDAD</a>
          <span style={{ color: '#4A4A4A' }}>-</span>
          <a href="#">TÉRMINOS Y CONDICIONES</a>
          <span style={{ color: '#4A4A4A' }}>-</span>
          <a href="#">DESCARGO DE RESPONSABILIDAD</a>
        </div>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '.14em', color: '#666' }}>
          © MACONDO MAGIC SOFTWARES
        </p>
      </div>
    </footer>
  );
}
