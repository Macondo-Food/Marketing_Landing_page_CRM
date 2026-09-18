/**
 * Bloques custom para el editor de landings.
 * Extienden los bloques base de grapesjs-preset-webpage con componentes
 * específicos del proyecto (hero con CTA, sección de logos, etc.).
 */
export function registerCustomBlocks(editor) {
  // Hero con título + subtítulo + botón CTA
  editor.BlockManager.add('hero-cta', {
    label: 'Hero + CTA',
    category: 'Custom',
    content: `
      <section style="padding: 60px 20px; text-align: center; background: linear-gradient(135deg, #714B67 0%, #4A2D5C 100%); color: #fff;">
        <h1 style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 42px; margin-bottom: 16px;">Título Principal</h1>
        <p style="font-family: 'Source Sans 3', sans-serif; font-size: 18px; max-width: 600px; margin: 0 auto 32px; opacity: 0.9;">Subtítulo descriptivo que explica la propuesta de valor en una línea clara.</p>
        <a href="#" style="display: inline-block; padding: 14px 32px; background: #FF6B35; color: #fff; text-decoration: none; border-radius: 8px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 16px;">Comenzar Ahora</a>
      </section>
    `,
  });

  // Sección de logos de clientes
  editor.BlockManager.add('client-logos', {
    label: 'Logos Clientes',
    category: 'Custom',
    content: `
      <section style="padding: 40px 20px; text-align: center; background: #f9f9f9;">
        <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px;">Confían en nosotros</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 40px; flex-wrap: wrap; max-width: 800px; margin: 0 auto;">
          <img src="https://via.placeholder.com/120x40?text=Logo+1" alt="Cliente 1" style="max-height: 40px;">
          <img src="https://via.placeholder.com/120x40?text=Logo+2" alt="Cliente 2" style="max-height: 40px;">
          <img src="https://via.placeholder.com/120x40?text=Logo+3" alt="Cliente 3" style="max-height: 40px;">
          <img src="https://via.placeholder.com/120x40?text=Logo+4" alt="Cliente 4" style="max-height: 40px;">
        </div>
      </section>
    `,
  });

  // Sección de features (3 columnas)
  editor.BlockManager.add('features-3col', {
    label: '3 Features',
    category: 'Custom',
    content: `
      <section style="padding: 60px 20px; max-width: 1000px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 40px; margin-bottom: 12px;">🚀</div>
            <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Feature Uno</h3>
            <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Descripción breve del primer beneficio clave.</p>
          </div>
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 40px; margin-bottom: 12px;">⚡</div>
            <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Feature Dos</h3>
            <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Descripción breve del segundo beneficio clave.</p>
          </div>
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 40px; margin-bottom: 12px;">🎯</div>
            <h3 style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;">Feature Tres</h3>
            <p style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #666;">Descripción breve del tercer beneficio clave.</p>
          </div>
        </div>
      </section>
    `,
  });

  // Formulario de contacto — apunta a POST /leads con landing slug (#16, #19, #21).
  // Al publicar, el backend inyecta/verifica: hidden landing, checkbox tratamiento,
  // action="/leads" y method="POST" si faltan.
  // Los campos required se pueden toggle desde el panel de propiedades de GrapesJS (#17).
  editor.BlockManager.add('contact-form', {
    label: 'Formulario',
    category: 'Custom',
    content: `
      <section style="padding: 60px 20px; background: #f4f4f5;">
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
    `,
  });

  // Footer simple
  editor.BlockManager.add('footer-simple', {
    label: 'Footer',
    category: 'Custom',
    content: `
      <footer style="padding: 30px 20px; text-align: center; background: #1f1f1f; color: #999;">
        <p style="font-family: 'Source Sans 3', sans-serif; font-size: 13px; margin: 0;">© 2026 Tu Empresa. Todos los derechos reservados.</p>
      </footer>
    `,
  });
}
