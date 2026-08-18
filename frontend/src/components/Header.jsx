import macondoLogo from '../assets/macondo-logo.png';
import macondoLogoWebp from '../assets/macondo-logo.webp';

export default function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'flex-start', padding: '22px 32px 0' }}>
      <picture>
        <source srcSet={macondoLogoWebp} type="image/webp" />
        <img
          src={macondoLogo}
          alt="Logo de Macondo Softwares"
          width={300}
          height={300}
          style={{ width: 72, height: 72, objectFit: 'contain' }}
        />
      </picture>
    </header>
  );
}
