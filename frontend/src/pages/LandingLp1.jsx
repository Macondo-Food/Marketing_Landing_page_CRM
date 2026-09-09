import { useNavigate } from 'react-router-dom';
import macondoLogo from '../assets/macondo-logo.webp';
import { captureUtms } from '../utils/utm.js';
import { useEffect } from 'react';

const gold = '#f7b32b';
const bg = '#070d18';
const bgAlt = '#050a13';
const bgCard = '#0b1322';
const text = '#eef2f8';
const textMuted = '#b8c4d6';
const textMuted2 = '#8d9cb3';
const textDark = '#6f7d92';
const border = 'rgba(255,255,255,.07)';
const borderLight = 'rgba(255,255,255,.08)';
const borderGold = 'rgba(247,179,43,.22)';
const borderGoldLight = 'rgba(247,179,43,.4)';

const headingFont = "'Montserrat', sans-serif";
const bodyFont = "'Source Sans 3', system-ui, sans-serif";
const monoFont = "'Montserrat', monospace";

const clientLogos = ['Whale Cloud', 'Claro', 'GovLab', 'Manizales', 'Toka', 'U. La Sabana'];

const painPoints = [
  {
    tag: 'EGRESS',
    title: 'El cobro fantasma que nunca ves en el diagrama',
    body: 'Sacar datos de AWS o Azure cuesta. Cada GB que sale de la nube grande es un peaje que no aparece en tu propuesta inicial pero sí en tu factura real.',
  },
  {
    tag: 'LOCK-IN',
    title: 'Migrar sale caro porque diseñaron para que te quedes',
    body: 'Los servicios propietarios te amarran. Cada integración custom que haces es un candado más. Y nadie en tu equipo quiere ser el que propone desarmarlo.',
  },
  {
    tag: 'SOBRE-PROVISIONAMIENTO',
    title: 'Pagas por máquinas que duermen el 60% del tiempo',
    body: 'Las instancias quedan encendidas por si acaso. Nadie las apaga porque nadie sabe si algo depende de ellas. Y así cada mes.',
  },
  {
    tag: 'SOPORTE',
    title: 'Tickets en inglés, respuestas en 48 horas',
    body: 'Cuando algo se rompe a las 2am, tu ingeniero espera un ticket en inglés. El soporte premium cuesta extra y no siempre contesta rápido.',
  },
];

const solutionItems = [
  {
    icon: '→',
    title: 'Migración sin costo',
    body: 'Replicamos tu arquitectura 1:1 en Alibaba Cloud. QA primero, producción cuando estés listo. Sin honorarios de migración.',
  },
  {
    icon: '→',
    title: 'Soporte humano en español',
    body: 'Ingenieros reales, en tu idioma, en tu zona horaria. Sin tickets que rebotan entre equipos.',
  },
  {
    icon: '→',
    title: 'Comparativo 1:1 de tu factura',
    body: 'Tomamos tu factura real y la cotizamos línea por línea en Alibaba Cloud. Ahorro directo, mes a mes.',
  },
  {
    icon: '→',
    title: 'Reversa disponible',
    body: 'Si algo no funciona como esperas, migramos de vuelta. Sin penalización, sin drama.',
  },
];

const steps = [
  { n: '01', title: 'Sesión gratuita de 45 min', body: 'Revisamos tu arquitectura actual, tu factura y tus objetivos de ahorro.' },
  { n: '02', title: 'Comparativo 1:1', body: 'Cotizamos tu misma arquitectura en Alibaba Cloud, línea por línea.' },
  { n: '03', title: 'Migración QA sin costo', body: 'Replicamos en ambiente de pruebas. Tú validas rendimiento antes de decidir.' },
  { n: '04', title: 'Go-live cuando estés listo', body: 'Producción cuando tú digas. Con reversa disponible en todo momento.' },
];

export default function LandingLp1() {
  const navigate = useNavigate();

  useEffect(() => { captureUtms(); }, []);

  function goToForm() { navigate('/form'); }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', fontFamily: bodyFont, background: bg, color: text, WebkitFontSmoothing: 'antialiased' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px clamp(16px,5vw,64px)', borderBottom: `1px solid ${border}`, position: 'relative', zIndex: 3 }}>
        <img src={macondoLogo} alt="Logo Macondo" style={{ width: 132, height: 38, objectFit: 'contain', borderRadius: 10 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: textMuted2, fontFamily: monoFont }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: text }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: gold, display: 'inline-block' }} />
            Partner oficial Alibaba Cloud
          </span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', padding: 'clamp(40px,6vw,84px) clamp(16px,5vw,64px) clamp(48px,6vw,80px)', background: `radial-gradient(1100px 520px at 12% -10%, rgba(247,179,43,.13), transparent 60%), radial-gradient(900px 480px at 92% 8%, rgba(45,120,255,.14), transparent 62%)` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 'clamp(28px,4vw,56px)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '7px 14px', border: `1px solid ${borderGoldLight}`, borderRadius: 999, fontFamily: monoFont, fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: gold, marginBottom: 22 }}>
              Para CEOs, CFOs y CTOs en LatAm
            </div>
            <h1 style={{ fontFamily: headingFont, fontWeight: 800, fontSize: 'clamp(34px,4.6vw,62px)', lineHeight: 1.04, letterSpacing: '-.02em', margin: '0 0 20px' }}>
              Recupera hasta un <span style={{ color: gold }}>30%</span> de tu factura de nube. Sin bajar un solo punto de rendimiento.
            </h1>
            <p style={{ fontSize: 'clamp(16px,1.5vw,20px)', lineHeight: 1.6, color: textMuted, margin: '0 0 30px', maxWidth: '56ch' }}>
              Replicamos tu arquitectura de AWS, Azure, Oracle o GCP <strong style={{ color: text }}>uno a uno</strong> en Alibaba Cloud: migración paulatina sin costo, soporte humano en español y ese ahorro directo a tu caja libre, mes a mes.
            </p>
            <button
              onClick={goToForm}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, background: gold, color: '#0a0f1a',
                fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(15px,1.4vw,18px)',
                padding: '18px 30px', borderRadius: 12, border: 'none', cursor: 'pointer',
                boxShadow: `0 0 0 0 rgba(247,179,43,.45)`,
              }}
            >
              Quiero mi Sesión Gratuita <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', marginTop: 20, fontFamily: monoFont, fontSize: 12.5, color: textMuted2, letterSpacing: '.02em' }}>
              <span style={{ color: text }}>45 min · 1 a 1</span>
              <span style={{ color: text }}>Sin costo · sin compromiso</span>
              <span style={{ color: text }}>Comparativo 1:1 de tu factura</span>
            </div>
          </div>
          {/* Hero visual placeholder */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -14, borderRadius: 24, background: 'linear-gradient(135deg, rgba(247,179,43,.28), rgba(45,120,255,.2))', filter: 'blur(28px)' }} />
            <div style={{ position: 'relative', border: `1px solid rgba(255,255,255,.1)`, borderRadius: 18, overflow: 'hidden', background: bgCard, aspectRatio: '1/1', maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: monoFont, fontSize: 13, color: textDark, letterSpacing: '.1em', textTransform: 'uppercase', textAlign: 'center', padding: 24 }}>
                Comparativo de factura<br />AWS vs Alibaba Cloud<br />(imagen)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: '34px 0 40px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, background: bgAlt }}>
        <p style={{ textAlign: 'center', fontFamily: monoFont, fontSize: 14, letterSpacing: '.22em', textTransform: 'uppercase', color: text, margin: '0 0 26px' }}>
          Han confiado en nosotros
        </p>
        <div style={{ position: 'relative', overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'lp1-marquee 30s linear infinite' }}>
            {[...clientLogos, ...clientLogos].map((logo, i) => (
              <div key={i} style={{ width: 150, height: 56, border: '1px dashed rgba(255,255,255,.16)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: monoFont, fontSize: 11, letterSpacing: '.1em', color: textDark, textTransform: 'uppercase', flex: 'none', margin: '0 clamp(14px,2vw,32px)' }}>
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGITATION */}
      <section style={{ padding: 'clamp(56px,7vw,100px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 820, marginBottom: 'clamp(34px,4vw,52px)' }}>
            <p style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: gold, margin: '0 0 16px' }}>
              El problema que nadie te nombró
            </p>
            <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(28px,3.4vw,46px)', lineHeight: 1.1, letterSpacing: '-.015em', margin: '0 0 18px' }}>
              Tu factura de nube no es alta. Es un peaje a tu propio crecimiento.
            </h2>
            <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.65, color: text, margin: 0 }}>
              El número del mes se parece al del mes pasado, entonces se aprueba. Eso no es un presupuesto: es un acto de fe con firma. Estos son los cobros que crecen contigo y que nunca aparecen en el diagrama de arquitectura.
            </p>
          </div>

          {/* Pain cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 'clamp(32px,4vw,48px)' }}>
            {painPoints.map((p, i) => (
              <div key={i} style={{ background: bgCard, border: `1px solid ${borderLight}`, borderRadius: 16, padding: '26px 24px' }}>
                <div style={{ fontFamily: monoFont, fontSize: 12, color: gold, letterSpacing: '.14em', marginBottom: 14 }}>{p.tag}</div>
                <h3 style={{ fontFamily: headingFont, fontWeight: 600, fontSize: 19, lineHeight: 1.3, margin: '0 0 10px', color: text }}>{p.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: text, margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>

          {/* Highlight callout + chart */}
          <div style={{ background: `linear-gradient(180deg, rgba(247,179,43,.08), rgba(247,179,43,.02))`, border: `1px solid ${borderGold}`, borderRadius: 18, padding: 'clamp(24px,3vw,36px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'clamp(20px,3vw,40px)', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(20px,2.2vw,28px)', lineHeight: 1.2, margin: '0 0 12px', color: gold }}>
                No te quedas porque sea la mejor nube. Te quedas porque nunca has comparado.
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: text, margin: 0 }}>
                Comparar cuesta trabajo y nadie quiere ser el que propone mover producción. Entonces el default gana. Todos los meses. Por omisión. Y cada mes de omisión sale de tu EBITDA.
              </p>
            </div>
            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
              {[42, 53, 62, 74, 87, 100].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
                  <div style={{ width: '100%', height: `${h}%`, background: `linear-gradient(180deg, ${gold}, rgba(247,179,43,.35))`, borderRadius: '6px 6px 0 0' }} />
                  <span style={{ fontFamily: monoFont, fontSize: 10.5, color: textMuted2 }}>{['Ene', 'Mar', 'May', 'Jul', 'Sep', 'Nov'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ padding: 'clamp(56px,7vw,100px) clamp(16px,5vw,64px)', background: bgAlt, borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 820, marginBottom: 'clamp(34px,4vw,52px)' }}>
            <p style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: gold, margin: '0 0 16px' }}>
              La solución
            </p>
            <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(28px,3.4vw,46px)', lineHeight: 1.1, letterSpacing: '-.015em', margin: '0 0 18px' }}>
              Tu misma arquitectura, 30% menos. Sin reescribir una sola línea de código.
            </h2>
            <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.65, color: text, margin: 0 }}>
              Alibaba Cloud tiene servicios equivalentes a los que ya usas: ECS por EC2, OSS por S3, ApsaraDB por RDS. Migramos uno a uno, sin rediseño, sin re-arquitectura.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {solutionItems.map((item, i) => (
              <div key={i} style={{ background: bgCard, border: `1px solid ${borderLight}`, borderRadius: 16, padding: '26px 24px' }}>
                <div style={{ fontFamily: monoFont, fontSize: 18, color: gold, marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontFamily: headingFont, fontWeight: 600, fontSize: 19, lineHeight: 1.3, margin: '0 0 10px', color: text }}>{item.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: text, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section style={{ padding: 'clamp(56px,7vw,100px) clamp(16px,5vw,64px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(34px,4vw,52px)' }}>
            <p style={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: gold, margin: '0 0 16px' }}>
              El proceso
            </p>
            <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(28px,3.4vw,46px)', lineHeight: 1.1, margin: 0 }}>
              4 pasos. Cero riesgo.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ background: bgCard, border: `1px solid ${borderLight}`, borderRadius: 16, padding: '30px 24px', position: 'relative' }}>
                <div style={{ fontFamily: monoFont, fontSize: 40, fontWeight: 800, color: gold, opacity: 0.2, position: 'absolute', top: 16, right: 20, lineHeight: 1 }}>{step.n}</div>
                <div style={{ fontFamily: monoFont, fontSize: 12, color: gold, letterSpacing: '.14em', marginBottom: 14 }}>{step.n}</div>
                <h3 style={{ fontFamily: headingFont, fontWeight: 600, fontSize: 18, lineHeight: 1.3, margin: '0 0 10px', color: text }}>{step.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: text, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: 'clamp(56px,7vw,100px) clamp(16px,5vw,64px)', background: bgAlt, borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: headingFont, fontWeight: 800, fontSize: 'clamp(28px,3.4vw,46px)', lineHeight: 1.1, margin: '0 0 18px' }}>
            ¿Listo para ver cuánto estás pagando de más?
          </h2>
          <p style={{ fontSize: 'clamp(16px,1.5vw,20px)', lineHeight: 1.6, color: textMuted, margin: '0 0 34px' }}>
            Agenda tu sesión gratuita de 45 minutos. Sin costo, sin compromiso. Sal sabiendo, número al lado de número, cuánto puedes ahorrar.
          </p>
          <button
            onClick={goToForm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, background: gold, color: '#0a0f1a',
              fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(15px,1.4vw,18px)',
              padding: '18px 30px', borderRadius: 12, border: 'none', cursor: 'pointer',
            }}
          >
            Quiero mi Sesión Gratuita <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: 'clamp(30px,4vw,46px) clamp(16px,5vw,64px)', background: bgAlt }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '22px 40px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 15, letterSpacing: '.12em', color: text, marginBottom: 8 }}>MACONDO MAGIC SOFTWARES</div>
            <div style={{ fontFamily: monoFont, fontSize: 11.5, letterSpacing: '.14em', color: textDark, textTransform: 'uppercase' }}>Todos los derechos reservados</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', alignItems: 'center', fontFamily: monoFont, fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Políticas de privacidad</a>
            <span style={{ color: '#3d4a5e' }}>–</span>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Términos y condiciones</a>
            <span style={{ color: '#3d4a5e' }}>–</span>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Descargo de responsabilidad</a>
          </div>
          <div style={{ fontFamily: monoFont, fontSize: 11.5, color: textDark }}>© Macondo Magic Softwares</div>
        </div>
      </footer>

      {/* Marquee animation */}
      <style>{`
        @keyframes lp1-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
