import macondoLogo from '../assets/macondo-logo.png';

export default function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'flex-start', padding: '22px 32px 0' }}>
      <img
        src={macondoLogo}
        alt="logo Macondo"
        style={{ width: 72, height: 72, objectFit: 'contain' }}
      />
    </header>
  );
}
