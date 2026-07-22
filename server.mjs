// Tiny zero-dependency static server for the built `dist/` folder.
// Used by Railway (and any Node host): `node server.mjs`.
// Vite env vars are baked at BUILD time, so VITE_SHEET_ID / VITE_GSHEET_API_KEY
// must be set before `npm run build` runs — this server only serves the output.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    // Railway's health check.
    if (urlPath === '/healthz') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      return res.end('ok');
    }

    if (urlPath.endsWith('/')) urlPath += 'index.html';
    // Strip any leading "../" to prevent path traversal.
    const safe = normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = join(DIST, safe);

    let data;
    try {
      data = await readFile(filePath);
    } catch {
      // A missing file that looks like an asset must 404. Falling back to
      // index.html would return HTML under a .js content-type, and the browser
      // would refuse it with a confusing MIME error instead of a plain 404.
      if (extname(safe)) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        return res.end('Not found');
      }
      // SPA-style fallback for route-like paths.
      filePath = join(DIST, 'index.html');
      data = await readFile(filePath);
    }

    const type = TYPES[extname(filePath)] || 'application/octet-stream';
    const cache = filePath.includes(`${join('', 'assets')}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    res.writeHead(200, { 'content-type': type, 'cache-control': cache });
    res.end(data);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Engosoft HR — serving dist on port ${PORT}`);
});
