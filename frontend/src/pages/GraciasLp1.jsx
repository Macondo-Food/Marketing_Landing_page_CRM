import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import macondoLogo from '../assets/macondo-logo.webp';
import { loadMarketingPixels } from '../utils/marketingPixels.js';

const gold = '#f7b32b';
const bg = '#070d18';
const text = '#E7E7E5';
const muted = '#8d9cb3';
const border = 'rgba(247,179,43,.22)';
const borderLight = 'rgba(255,255,255,.09)';

const prepSteps = [
  { n: '01', title: 'Tu última factura de nube', body: 'AWS, Azure, Oracle o GCP — el PDF o el desglose de costos del mes.' },
  { n: '02', title: 'Inventario de máquinas y servicios', body: 'VMs, tipos de instancia, storage, bases de datos, Kubernetes.' },
  { n: '03', title: 'Tu ingeniero cloud en la llamada', body: 'Quien conoce la arquitectura. Así el comparativo sale exacto, no aproximado.' },
];

const nextSteps = [
  'Recibes tu misma arquitectura cotizada 1:1 en Alibaba Cloud, línea por línea.',
  'Te entregamos la auditoría FinOps con recomendaciones que puedes aplicar incluso si no migras.',
  'Si decides seguir, migramos QA sin honorarios y con reversa disponible en todo momento.',
];

export default function GraciasLp1() {
  const navigate = useNavigate();

  useEffect(() => {
    loadMarketingPixels('lp1');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Source Sans 3', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      background: bg,
      color: text,
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '18px clamp(16px,5vw,64px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}>
        <img src={macondoLogo} alt="Logo Macondo" style={{ width: 132, height: 38, borderRadius: 10, objectFit: 'contain' }} />
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: "'Montserrat', monospace",
          fontSize: 13,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: muted,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: gold, display: 'inline-block' }} />
          Partner oficial Alibaba Cloud
        </span>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        padding: 'clamp(44px,6vw,90px) clamp(16px,5vw,64px)',
        background: `radial-gradient(1000px 480px at 50% -8%, rgba(247,179,43,.14), transparent 62%)`,
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {/* Success section */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(34px,4vw,52px)' }}>
            <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto 26px' }}>
              <div style={{
                position: 'relative',
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0a0f1a',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: 34,
                lineHeight: 1,
              }}>
                ✓
              </div>
            </div>
            <p style={{
              fontFamily: "'Montserrat', monospace",
              fontSize: 12,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: gold,
              margin: '0 0 16px',
            }}>
              Sesión confirmada
            </p>
            <h1 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(30px,4vw,52px)',
              lineHeight: 1.06,
              letterSpacing: '-.02em',
              margin: '0 0 18px',
            }}>
              Listo. Tu diagnóstico FinOps ya está agendado.
            </h1>
            <p style={{
              fontSize: 'clamp(16px,1.5vw,19px)',
              lineHeight: 1.65,
              color: text,
              margin: '0 auto',
              maxWidth: '60ch',
            }}>
              Te enviamos la invitación al correo con el enlace de la reunión.
              En 45 minutos vas a salir sabiendo, número al lado de número,
              cuánto estás pagando de más.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 16,
            marginBottom: 26,
          }}>
            {/* WhatsApp card */}
            <div style={{
              border: `1px solid ${border}`,
              background: 'linear-gradient(180deg, rgba(247,179,43,.08), rgba(247,179,43,.02))',
              borderRadius: 18,
              padding: 'clamp(22px,2.6vw,30px)',
            }}>
              <h3 style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: 19,
                margin: '0 0 10px',
                color: '#fff',
              }}>
                ¿Necesitas mover la cita o sumar a tu CTO?
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: text, margin: '0 0 20px' }}>
                Escríbenos directo por WhatsApp. Contesta un ingeniero, no un bot.
              </p>
              <a
                href="https://wa.me/573334002353"
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: gold,
                  color: '#0a0f1a',
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: 15.5,
                  padding: '15px 26px',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Escribir por WhatsApp <span style={{ fontSize: 19, lineHeight: 1 }}>→</span>
              </a>
            </div>

            {/* Next steps card */}
            <div style={{
              border: `1px solid ${borderLight}`,
              background: '#0b1322',
              borderRadius: 18,
              padding: 'clamp(22px,2.6vw,30px)',
            }}>
              <h3 style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: 19,
                margin: '0 0 14px',
                color: '#fff',
              }}>
                Qué pasa después de la sesión
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {nextSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: gold,
                      marginTop: 7,
                      flex: 'none',
                    }} />
                    <div style={{ fontSize: 15, lineHeight: 1.55, color: text }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email */}
          <div style={{
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,.08)',
            paddingTop: 'clamp(26px,3vw,38px)',
          }}>
            <p style={{
              fontFamily: "'Montserrat', monospace",
              fontSize: 13,
              letterSpacing: '.06em',
              color: muted,
              margin: '14px 0 0',
            }}>
              <a href="mailto:info@macondosoftwares.com" style={{ color: gold, textDecoration: 'none' }}>
                info@macondosoftwares.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,.08)',
        padding: 'clamp(30px,4vw,46px) clamp(16px,5vw,64px)',
        background: '#050a13',
      }}>
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '22px 40px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '.12em',
              color: text,
              marginBottom: 8,
            }}>
              MACONDO MAGIC SOFTWARES
            </div>
            <div style={{
              fontFamily: "'Montserrat', monospace",
              fontSize: 11.5,
              letterSpacing: '.14em',
              color: '#6f7d92',
              textTransform: 'uppercase',
            }}>
              Todos los derechos reservados
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 16px',
            alignItems: 'center',
            fontFamily: "'Montserrat', monospace",
            fontSize: 11.5,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Políticas de privacidad</a>
            <span style={{ color: '#3d4a5e' }}>–</span>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Términos y condiciones</a>
            <span style={{ color: '#3d4a5e' }}>–</span>
            <a href="#" style={{ color: '#9fadc1', textDecoration: 'none' }}>Descargo de responsabilidad</a>
          </div>
          <div style={{ fontFamily: "'Montserrat', monospace", fontSize: 11.5, color: '#6f7d92' }}>
            © Macondo Magic Softwares
          </div>
        </div>
      </footer>
    </div>
  );
}
