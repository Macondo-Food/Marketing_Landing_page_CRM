import whaleCloud from '../assets/whale-cloud-logo.png';
import whaleCloudWebp from '../assets/whale-cloud-logo.webp';
import claro from '../assets/claro-logo.png';
import claroWebp from '../assets/claro-logo.webp';
import govLab from '../assets/gov-lab-logo.png';
import govLabWebp from '../assets/gov-lab-logo.webp';
import manizales from '../assets/manizales-logo.png';
import manizalesWebp from '../assets/manizales-logo.webp';
import toka from '../assets/toka-logo.png';
import tokaWebp from '../assets/toka-logo.webp';
import universidadSabana from '../assets/universidad-sabana-logo.png';
import universidadSabanaWebp from '../assets/universidad-sabana-logo.webp';

const clientes = [
  {
    id: 'whale-cloud',
    src: whaleCloud,
    srcWebp: whaleCloudWebp,
    width: 274,
    height: 216,
    displayHeight: 44,
    alt: 'Logo de Whale Cloud, cliente de Macondo Softwares',
  },
  {
    id: 'claro',
    src: claro,
    srcWebp: claroWebp,
    width: 274,
    height: 216,
    displayHeight: 44,
    alt: 'Logo de Claro, cliente de Macondo Softwares',
  },
  {
    id: 'gov-lab',
    src: govLab,
    srcWebp: govLabWebp,
    width: 255,
    height: 90,
    displayHeight: 32,
    alt: 'Logo de Govlab Universidad de La Sabana, cliente de Macondo Softwares',
  },
  {
    id: 'manizales',
    src: manizales,
    srcWebp: manizalesWebp,
    width: 512,
    height: 161,
    displayHeight: 36,
    alt: 'Logo de Manizales del Alma y People Contact, cliente de Macondo Softwares',
  },
  {
    id: 'toka',
    src: toka,
    srcWebp: tokaWebp,
    width: 274,
    height: 216,
    displayHeight: 44,
    alt: 'Logo de Toka, cliente de Macondo Softwares',
  },
  {
    id: 'universidad-sabana',
    src: universidadSabana,
    srcWebp: universidadSabanaWebp,
    width: 512,
    height: 180,
    displayHeight: 38,
    alt: 'Logo de la Universidad de La Sabana, cliente de Macondo Softwares',
  },
];

function ClientCard({ cliente }) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        width: 190,
        background: '#fff',
        borderRadius: 10,
        padding: 20,
        height: 88,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
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
  );
}

export default function ClientsSection() {
  // El track duplica la lista de logos una vez y la anima con
  // translateX(-50%) (keyframes en index.css) — como las dos mitades son
  // idénticas, el loop queda continuo y sin salto visible. Se pausa al
  // pasar el mouse (:hover en index.css) y se desactiva por completo con
  // prefers-reduced-motion.
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
      <div
        style={{
          overflow: 'hidden',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <div className="clients-track" style={{ display: 'flex', width: 'max-content' }}>
          {[...clientes, ...clientes].map((cliente, index) => (
            <ClientCard key={`${cliente.id}-${index}`} cliente={cliente} />
          ))}
        </div>
      </div>
    </section>
  );
}
