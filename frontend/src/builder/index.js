import grapesjs from 'grapesjs';
import webpagePreset from 'grapesjs-preset-webpage';
import { registerCustomBlocks } from './blocks.js';
import { vslTemplate } from './template-vsl.js';

/**
 * Inicializa el editor GrapesJS en el contenedor dado.
 *
 * @param {string|HTMLElement} container — selector o elemento DOM
 * @param {object} opts
 * @param {string} [opts.projectData] — JSON del editor para reabrir una landing existente
 * @param {string} [opts.assetManagerUrl] — URL base de assets (para el asset manager)
 * @param {string} [opts.authToken] — token para subir assets
 * @returns {object} instancia del editor
 */
export function initEditor(container, { projectData, assetManagerUrl, authToken } = {}) {
  const editor = grapesjs.init({
    container,
    height: '100%',
    width: 'auto',
    storageManager: false,
    plugins: [webpagePreset],
    pluginsOpts: {
      [webpagePreset]: {},
    },
    assetManager: {
      assets: [],
      upload: assetManagerUrl || '',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      uploadName: 'file',
    },
    canvas: {
      styles: [
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Source+Sans+3:wght@400;600&display=swap',
      ],
    },
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px', widthMedia: '768px' },
        { name: 'Mobile', width: '375px', widthMedia: '375px' },
      ],
    },
  });

  registerCustomBlocks(editor);

  if (projectData) {
    try {
      editor.loadProjectData(JSON.parse(projectData));
    } catch {
      loadTemplate(editor);
    }
  } else {
    loadTemplate(editor);
  }

  return editor;
}

function loadTemplate(editor) {
  editor.setComponents(vslTemplate.html);
  editor.setStyle(vslTemplate.css);
}
