import cliente1 from '../assets/cliente-1.png';
import cliente1Webp from '../assets/cliente-1.webp';
import cliente2 from '../assets/cliente-2.png';
import cliente2Webp from '../assets/cliente-2.webp';
import cliente3 from '../assets/cliente-3.png';
import cliente3Webp from '../assets/cliente-3.webp';
import cliente4 from '../assets/cliente-4.png';
import cliente4Webp from '../assets/cliente-4.webp';
import cliente5 from '../assets/cliente-5.png';
import cliente5Webp from '../assets/cliente-5.webp';
import cliente6 from '../assets/cliente-6.png';
import cliente6Webp from '../assets/cliente-6.webp';

const clientes = [
  {
    id: 'cliente-1',
    src: cliente1,
    srcWebp: cliente1Webp,
    width: 300,
    height: 300,
    displayHeight: 46,
    alt: 'Logo de empresa cliente de Macondo Softwares 1',
  },
  {
    id: 'cliente-2',
    src: cliente2,
    srcWebp: cliente2Webp,
    width: 400,
    height: 154,
    displayHeight: 34,
    alt: 'Logo de empresa cliente de Macondo Softwares 2',
  },
  {
    id: 'cliente-3',
    src: cliente3,
    srcWebp: cliente3Webp,
    width: 300,
    height: 300,
    displayHeight: 46,
    alt: 'Logo de empresa cliente de Macondo Softwares 3',
  },
  {
    id: 'cliente-4',
    src: cliente4,
    srcWebp: cliente4Webp,
    width: 300,
    height: 285,
    displayHeight: 46,
    alt: 'Logo de empresa cliente de Macondo Softwares 4',
  },
  {
    id: 'cliente-6',
    src: cliente6,
    srcWebp: cliente6Webp,
    width: 500,
    height: 169,
    displayHeight: 42,
    alt: 'Logo de empresa cliente de Macondo Softwares 6',
  },
  {
    id: 'cliente-5',
    src: cliente5,
    srcWebp: cliente5Webp,
    width: 400,
    height: 209,
    displayHeight: 40,
    alt: 'Logo de empresa cliente de Macondo Softwares 5',
  },
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
            <picture>
              <source srcSet={cliente.srcWebp} type="image/webp" />
              <img
                src={cliente.src}
                alt={cliente.alt}
                width={cliente.width}
                height={cliente.height}
                loading="lazy"
                style={{ width: '100%', height: cliente.displayHeight, objectFit: 'contain' }}
              />
            </picture>
          </div>
        ))}
      </div>
    </section>
  );
}
