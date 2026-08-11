import cliente1 from '../assets/cliente-1.png';
import cliente2 from '../assets/cliente-2.png';
import cliente3 from '../assets/cliente-3.png';
import cliente4 from '../assets/cliente-4.png';
import cliente5 from '../assets/cliente-5.png';
import cliente6 from '../assets/cliente-6.png';

const clientes = [
  { id: 'cliente-1', src: cliente1, height: 46 },
  { id: 'cliente-2', src: cliente2, height: 34 },
  { id: 'cliente-3', src: cliente3, height: 46 },
  { id: 'cliente-4', src: cliente4, height: 46 },
  { id: 'cliente-6', src: cliente6, height: 42 },
  { id: 'cliente-5', src: cliente5, height: 40 },
];

export default function ClientsSection() {
  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '70px 24px 80px' }}>
      <h2
        style={{
          margin: '0 0 30px',
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(20px, 2.4vw, 28px)',
          letterSpacing: '-0.01em',
        }}
      >
        Han confiado en nosotros
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {clientes.map((cliente) => (
          <div
            key={cliente.id}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 20,
              minHeight: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={cliente.src}
              alt="logo cliente"
              style={{ width: '100%', height: cliente.height, objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
