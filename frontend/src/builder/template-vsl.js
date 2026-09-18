/**
 * Template base para el editor de landings — estructura simplificada de la
 * VSL Macondo. Marketing parte de este esqueleto y personaliza textos,
 * imágenes y colores.
 *
 * Nota: la VSL real tiene React + Vturb + quiz interactivo que no se pueden
 * representar en HTML plano. Este template captura la estructura visual
 * (hero + video placeholder + logos + CTA + footer) como punto de partida.
 */
export const vslTemplate = {
  html: `
    <header style="padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e4e4e7;">
      <img src="/uploads/placeholder-logo.png" alt="Logo" style="height: 36px;">
      <a href="#contacto" style="padding: 10px 24px; background: #FF6B35; color: #fff; text-decoration: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 14px;">Agendar Llamada</a>
    </header>

    <section style="padding: 80px 20px; text-align: center; background: linear-gradient(135deg, #714B67 0%, #4A2D5C 100%); color: #fff;">
      <h1 style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 42px; line-height: 1.2; max-width: 700px; margin: 0 auto 20px;">Transforma tu Infraestructura Cloud</h1>
      <p style="font-family: 'Source Sans 3', sans-serif; font-size: 18px; max-width: 550px; margin: 0 auto 36px; opacity: 0.9;">Descubre cómo las empresas líderes optimizan sus costos de nube con nuestra solución integral.</p>
      <a href="#video" style="display: inline-block; padding: 16px 36px; background: #FF6B35; color: #fff; text-decoration: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 16px;">Ver Presentación</a>
    </section>

    <section id="video" style="padding: 60px 20px; text-align: center; background: #fff;">
      <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; margin-bottom: 32px;">Mira cómo funciona</h2>
      <div style="max-width: 720px; margin: 0 auto; background: #1f1f1f; border-radius: 12px; padding: 200px 20px; color: #999; font-family: 'Source Sans 3', sans-serif;">
        Espacio para video — reemplaza este bloque con tu embed de video
      </div>
    </section>

    <section style="padding: 50px 20px; text-align: center; background: #f9f9f9;">
      <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px;">Confían en nosotros</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap; max-width: 800px; margin: 0 auto;">
        <div style="width: 120px; height: 40px; background: #e4e4e7; border-radius: 6px;"></div>
        <div style="width: 120px; height: 40px; background: #e4e4e7; border-radius: 6px;"></div>
        <div style="width: 120px; height: 40px; background: #e4e4e7; border-radius: 6px;"></div>
        <div style="width: 120px; height: 40px; background: #e4e4e7; border-radius: 6px;"></div>
        <div style="width: 120px; height: 40px; background: #e4e4e7; border-radius: 6px;"></div>
      </div>
    </section>

    <section style="padding: 60px 20px; max-width: 1000px; margin: 0 auto;">
      <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; text-align: center; margin-bottom: 40px;">¿Por qué elegirnos?</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
        <div style="text-align: center; padding: 24px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="font-size: 36px; margin-bottom: 12px;">💰</div>
          <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Ahorro Garantizado</h3>
          <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Reduce hasta un 40% tus costos de infraestructura cloud.</p>
        </div>
        <div style="text-align: center; padding: 24px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="font-size: 36px; margin-bottom: 12px;">🔧</div>
          <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Implementación Rápida</h3>
          <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Configuración completa en menos de 2 semanas.</p>
        </div>
        <div style="text-align: center; padding: 24px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="font-size: 36px; margin-bottom: 12px;">🤝</div>
          <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Soporte Dedicado</h3>
          <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Equipo de expertos acompañándote en cada paso.</p>
        </div>
      </div>
    </section>

    <section id="contacto" style="padding: 60px 20px; background: #f4f4f5;">
      <div style="max-width: 500px; margin: 0 auto;">
        <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; text-align: center; margin-bottom: 24px;">Contáctanos</h2>
        <form method="POST" action="/leads" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" name="landing" value="">
          <div>
            <label style="display:block;font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;margin-bottom:4px;color:#333;">Nombre completo *</label>
            <input type="text" name="nombre" placeholder="Tu nombre" required style="width:100%;padding: 12px 16px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 15px; font-family: 'Source Sans 3', sans-serif;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;margin-bottom:4px;color:#333;">Email *</label>
            <input type="email" name="email" placeholder="tu@email.com" required style="width:100%;padding: 12px 16px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 15px; font-family: 'Source Sans 3', sans-serif;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;margin-bottom:4px;color:#333;">Teléfono *</label>
            <input type="tel" name="telefono" placeholder="+57 300 123 4567" required style="width:100%;padding: 12px 16px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 15px; font-family: 'Source Sans 3', sans-serif;box-sizing:border-box;">
          </div>
          <div>
            <label style="display:block;font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;margin-bottom:4px;color:#333;">Empresa *</label>
            <input type="text" name="empresa" placeholder="Nombre de tu empresa" required style="width:100%;padding: 12px 16px; border: 1px solid #d4d4d8; border-radius: 8px; font-size: 15px; font-family: 'Source Sans 3', sans-serif;box-sizing:border-box;">
          </div>
          <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#666;font-family:'Source Sans 3',sans-serif;cursor:pointer;">
            <input type="checkbox" name="tratamiento_datos_aceptado" value="true" required style="margin-top:2px;">
            <span>Acepto el <strong>tratamiento de datos personales</strong> según la política de privacidad.</span>
          </label>
          <button type="submit" style="padding: 14px; background: #714B67; color: #fff; border: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 16px; cursor: pointer;">Enviar</button>
        </form>
      </div>
    </section>

    <footer style="padding: 30px 20px; text-align: center; background: #1f1f1f; color: #999;">
      <p style="font-family: 'Source Sans 3', sans-serif; font-size: 13px; margin: 0;">© 2026 Macondo Magic Software. Todos los derechos reservados.</p>
    </footer>
  `,
  css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', system-ui, sans-serif; color: #1f1f1f; }
    img { max-width: 100%; height: auto; }
    @media (max-width: 768px) {
      h1 { font-size: 28px !important; }
      h2 { font-size: 22px !important; }
      [style*="grid-template-columns: repeat(3"] {
        grid-template-columns: 1fr !important;
      }
    }
  `,
};
