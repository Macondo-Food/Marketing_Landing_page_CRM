import alibabaLogo from '../assets/alibaba-logo.png';

export default function Hero() {
  return (
    <section
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '20px 24px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          color: '#F8F522',
        }}
      >
        Seguramente estás pagando de más y no te diste cuenta
      </p>

      <h1
        style={{
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(28px, 4.1vw, 52px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textWrap: 'balance',
          maxWidth: '33ch',
        }}
      >
        Reduce hasta un <span style={{ color: '#F8F522' }}>30%</span> tu factura de infraestructura en la nube
      </h1>

      <p
        style={{
          margin: 0,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 'clamp(17px, 2vw, 22px)',
          lineHeight: 1.45,
          color: '#fff',
          maxWidth: '60ch',
          textWrap: 'pretty',
        }}
      >
        (AWS, Oracle, Azure o GCP) manteniendo exactamente el mismo rendimiento Enterprise.
      </p>

      <p
        style={{
          margin: 0,
          fontSize: 'clamp(15px, 1.45vw, 18px)',
          lineHeight: 1.6,
          color: '#B4B4B4',
          maxWidth: '96ch',
          textWrap: 'pretty',
        }}
      >
        Descubre cómo Macondo en partnert con Alibaba Cloud te eliminan los costos que no viste en la letra
        pequeña de transferencia de datos con una migración paulatina 1:1, cero costo de transición y soporte
        técnico humano en español.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px 10px 16px',
          border: '1px solid rgba(255,255,255,.16)',
          borderRadius: 999,
          background: '#fff',
        }}
      >
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: '#000',
          }}
        >
          Partner de
        </span>
        <img
          src={alibabaLogo}
          alt="Alibaba Cloud"
          style={{ width: 150, height: 27, objectFit: 'contain' }}
        />
      </div>
    </section>
  );
}
