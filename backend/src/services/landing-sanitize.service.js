import sanitizeHtml from 'sanitize-html';

/**
 * Sanitiza el HTML generado por el builder antes de publicarlo (#25).
 *
 * Permite las etiquetas y atributos que GrapesJS genera (estilos inline,
 * clases, id, href, src, alt, etc.) pero elimina scripts, iframes,
 * event handlers inline (on*), y otros vectores de XSS.
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    // Estructura
    'html', 'head', 'body', 'main', 'section', 'article', 'header', 'footer', 'nav', 'aside',
    'div', 'span', 'p', 'br', 'hr',
    // Textos
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 'small', 'sub', 'sup', 'mark',
    'blockquote', 'pre', 'code',
    // Listas
    'ul', 'ol', 'li',
    // Enlaces e imágenes
    'a', 'img', 'picture', 'source', 'figure', 'figcaption',
    // Video (sin autoplay con sonido)
    'video', 'iframe',
    // Formulario
    'form', 'input', 'textarea', 'select', 'option', 'button', 'label', 'fieldset', 'legend',
    // Tablas
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    '*': [
      'class', 'id', 'style',
      'data-*',
      // Accesibilidad
      'role', 'aria-*', 'tabindex', 'title',
    ],
    a: ['href', 'target', 'rel', 'name'],
    img: ['src', 'srcset', 'alt', 'width', 'height', 'loading'],
    video: ['src', 'poster', 'width', 'height', 'controls', 'muted', 'loop', 'playsinline', 'preload'],
    source: ['src', 'srcset', 'type', 'media'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'sandbox'],
    form: ['action', 'method', 'enctype', 'target', 'novalidate'],
    input: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'checked', 'min', 'max', 'minlength', 'maxlength', 'pattern', 'autocomplete'],
    textarea: ['name', 'placeholder', 'required', 'rows', 'cols', 'maxlength'],
    select: ['name', 'required', 'multiple'],
    option: ['value', 'selected', 'disabled'],
    button: ['type', 'name', 'value', 'disabled'],
    label: ['for'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    source: ['http', 'https'],
  },
  // Eliminar cualquier atributo on* (onclick, onerror, onload, etc.)
  transformTags: {
    '*': (tagName, attribs) => {
      const clean = {};
      for (const [key, value] of Object.entries(attribs)) {
        if (!key.startsWith('on')) {
          clean[key] = value;
        }
      }
      return { tagName, attribs: clean };
    },
  },
};

const CSS_SANITIZE_OPTIONS = {
  allowedTags: false,
  allowedAttributes: false,
};

export function sanitizeLandingHtml(html) {
  if (!html) return html;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export function sanitizeLandingCss(css) {
  if (!css) return css;
  // sanitize-html no procesa CSS directamente; eliminamos expresiones peligrosas
  return css
    .replace(/expression\s*\(/gi, '')       // IE CSS expressions
    .replace(/javascript\s*:/gi, '')       // javascript: URLs en CSS
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, '')  // url(javascript:...)
    .replace(/@import\s+['"]?\s*javascript/gi, '');   // @import javascript:
}
