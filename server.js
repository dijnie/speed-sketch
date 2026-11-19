import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  handleDecisionsPost,
  sendDecisionsError,
  sendJsonResponse,
} from './server/decisionsProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function lstatSafeFile(filePath) {
  try {
    const st = fs.lstatSync(filePath);
    return st.isFile() && !st.isSymbolicLink() ? st : null;
  } catch {
    return null;
  }
}

function lstatSafeDir(filePath) {
  try {
    const st = fs.lstatSync(filePath);
    return st.isDirectory() && !st.isSymbolicLink() ? st : null;
  } catch {
    return null;
  }
}

function serveFile(req, res, filePath, cacheControl) {
  const st = lstatSafeFile(filePath);
  if (!st) {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : 'Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': st.size,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('Static file read error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end();
  });
  stream.pipe(res);
}

function handleStaticRequest(req, res, pathname) {
  let decodedPath = '/';
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : 'Bad request');
    return;
  }
  if (decodedPath.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : 'Bad request');
    return;
  }

  const segments = decodedPath.split(/[\\/]+/).filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : 'Bad request');
    return;
  }

  const relativeSubpath = decodedPath.replace(/^\/+/, '');
  const candidatePath = path.resolve(DIST_DIR, relativeSubpath);
  if (
    candidatePath !== DIST_DIR &&
    !candidatePath.startsWith(DIST_DIR + path.sep)
  ) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : 'Bad request');
    return;
  }

  if (lstatSafeFile(candidatePath)) {
    const ext = path.extname(candidatePath).toLowerCase();
    const isImmutableAsset = decodedPath.startsWith('/assets/');
    const isHtml = ext === '.html';
    const cacheControl = isImmutableAsset
      ? 'public, max-age=31536000, immutable'
      : isHtml
        ? 'no-cache'
        : 'public, max-age=3600';
    serveFile(req, res, candidatePath, cacheControl);
    return;
  }

  if (lstatSafeDir(candidatePath)) {
    const dirIndex = path.join(candidatePath, 'index.html');
    if (lstatSafeFile(dirIndex)) {
      serveFile(req, res, dirIndex, 'no-cache');
      return;
    }
  }

  if (path.extname(decodedPath) === '') {
    const spaIndex = path.join(DIST_DIR, 'index.html');
    serveFile(req, res, spaIndex, 'no-cache');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(req.method === 'HEAD' ? undefined : 'Not found');
}

export function createAppServer(options = {}) {
  return http.createServer((req, res) => {
    let pathname = '/';
    try {
      pathname = new URL(req.url || '/', 'http://localhost').pathname;
    } catch {
      pathname = (req.url || '/').split('?')[0] || '/';
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      sendJsonResponse(res, 200, { status: 'ok' });
      return;
    }

    if (pathname === '/api/decisions') {
      if (req.method !== 'POST') {
        sendDecisionsError(
          res,
          405,
          'METHOD_NOT_ALLOWED',
          'Method not allowed. Use POST /api/decisions.',
        );
        return;
      }
      void handleDecisionsPost(req, res, options);
      return;
    }

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      sendDecisionsError(res, 404, 'NOT_FOUND', 'Unknown API route');
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendDecisionsError(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
      return;
    }

    handleStaticRequest(req, res, pathname);
  });
}

const isDirectMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectMain) {
  const rawPort = Number(process.env.PORT || 3000);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;
  const server = createAppServer();
  server.listen(port, '0.0.0.0');
}
