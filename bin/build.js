import * as esbuild from 'esbuild';
import { readdirSync, existsSync } from 'fs';
import { join, sep } from 'path';

// Config output
const BUILD_DIRECTORY = 'dist';
const PRODUCTION = process.env.NODE_ENV === 'production';

// Config entrypoint files
const ENTRY_POINTS = ['src/index.ts'];

// Config dev serving
const LIVE_RELOAD = !PRODUCTION;
const SERVE_PORT = 3000;
const USE_HTTPS = true; // Set to false to use HTTP
const CERT_DIR = './bin/certs';
const SERVE_ORIGIN = USE_HTTPS
  ? `https://localhost:${SERVE_PORT}`
  : `http://localhost:${SERVE_PORT}`;

// Create context
const context = await esbuild.context({
  bundle: true,
  entryPoints: ENTRY_POINTS,
  outdir: BUILD_DIRECTORY,
  minify: PRODUCTION,
  sourcemap: !PRODUCTION,
  target: PRODUCTION ? 'es2020' : 'esnext',
  inject: LIVE_RELOAD ? ['./bin/live-reload.js'] : undefined,
  define: {
    SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});

// Build files in prod
if (PRODUCTION) {
  await context.rebuild();
  context.dispose();
}

// Watch and serve files in dev
else {
  await context.watch();

  // Prepare serve options
  const serveOptions = {
    servedir: BUILD_DIRECTORY,
    port: SERVE_PORT,
  };

  // Add HTTPS if enabled and certs exist
  if (USE_HTTPS) {
    const keyPath = `${CERT_DIR}/localhost-key.pem`;
    const certPath = `${CERT_DIR}/localhost.pem`;

    if (existsSync(keyPath) && existsSync(certPath)) {
      serveOptions.keyfile = keyPath;
      serveOptions.certfile = certPath;
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[HTTPS] Certificates not found at ${CERT_DIR}/. Falling back to HTTP.\n` +
          `Run: mkdir -p ${CERT_DIR} && mkcert -key-file ${CERT_DIR}/localhost-key.pem -cert-file ${CERT_DIR}/localhost.pem localhost`
      );
    }
  }

  await context.serve(serveOptions).then(logServedFiles);
}

/**
 * Logs information about the files that are being served during local development.
 */
function logServedFiles() {
  /**
   * Recursively gets all files in a directory.
   * @param {string} dirPath
   * @returns {string[]} An array of file paths.
   */
  const getFiles = (dirPath) => {
    const files = readdirSync(dirPath, { withFileTypes: true }).map((dirent) => {
      const path = join(dirPath, dirent.name);
      return dirent.isDirectory() ? getFiles(path) : path;
    });

    return files.flat();
  };

  const files = getFiles(BUILD_DIRECTORY);

  const filesInfo = files
    .map((file) => {
      if (file.endsWith('.map')) return;

      // Normalize path and create file location
      const paths = file.split(sep);
      paths[0] = SERVE_ORIGIN;

      const location = paths.join('/');

      // Create import suggestion
      const tag = location.endsWith('.css')
        ? `<link href="${location}" rel="stylesheet" type="text/css"/>`
        : `<script defer src="${location}"></script>`;

      return {
        'File Location': location,
        'Import Suggestion': tag,
      };
    })
    .filter(Boolean);

  // eslint-disable-next-line no-console
  console.table(filesInfo);
}
