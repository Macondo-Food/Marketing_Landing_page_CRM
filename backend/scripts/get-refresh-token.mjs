// Script de un solo uso: obtiene el GOOGLE_REFRESH_TOKEN corriendo un flujo
// OAuth2 local ("loopback"). Correr manualmente con: pnpm get-google-token
//
// Requisitos previos (una sola vez, en Google Cloud Console):
//   1. Crear/seleccionar un proyecto y habilitar la "Google Calendar API".
//   2. Configurar la pantalla de consentimiento OAuth (modo "Testing" alcanza;
//      agrega la cuenta de Google que va a recibir las reuniones como test user).
//   3. Crear credenciales OAuth 2.0 → tipo "Desktop app" (este tipo permite
//      redirects a http://localhost:<cualquier puerto> sin whitelistear la URI
//      exacta, que es justo lo que usa este script).
//   4. Copiar el Client ID y el Client Secret a backend/.env
//      (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) antes de correr este script.
import 'dotenv/config';
import http from 'node:http';
import { google } from 'googleapis';

const PORT = 3210;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error(
    'Faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en backend/.env. ' +
      'Créalos primero en Google Cloud Console (ver comentario al inicio de este archivo).'
  );
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  // Fuerza a Google a reemitir un refresh_token aunque ya hayas autorizado
  // esta app antes (si no, en autorizaciones repetidas puede devolver uno vacío).
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\n1. Abre esta URL en tu navegador e inicia sesión con la cuenta de');
console.log('   Google cuyo calendario se usará para agendar las reuniones:\n');
console.log(authUrl);
console.log(`\n2. Esperando el redirect a ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Falta el parámetro "code" en el redirect.');
    return;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Autorización completa. Puedes cerrar esta pestaña y volver a la terminal.');

    if (tokens.refresh_token) {
      console.log('GOOGLE_REFRESH_TOKEN obtenido:\n');
      console.log(tokens.refresh_token);
      console.log('\nCópialo en backend/.env como GOOGLE_REFRESH_TOKEN.\n');
    } else {
      console.log(
        'Google no devolvió un refresh_token (probablemente ya habías autorizado ' +
          'esta app antes). Revoca el acceso en https://myaccount.google.com/permissions ' +
          'y vuelve a correr este script.\n'
      );
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error al intercambiar el código por tokens. Revisa la terminal.');
    console.error(err);
  } finally {
    server.close();
  }
});

server.listen(PORT);
