/**
 * Hece Zinciri PRO - 7/24 Üretim Sunucusu + Çift Tünel (Sabit Ngrok & Cloudflare) Watchdog
 * 1. Derlenmiş `dist/` klasörünü Gzip sıkıştırmasıyla 127.0.0.1:5173 üzerinde sunar.
 * 2. Sabit Ngrok tünelini (https://phoniness-unmasked-rebalance.ngrok-free.dev) sürekli izler;
 *    VDS/diğer makinedeki eski kripto botu kapatıldığı anda otomatik olarak sabit adresi devralır!
 * 3. Eşzamanlı olarak Cloudflare 7/24 HTTPS tünelini (trycloudflare.com) aktif tutar.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const IS_RENDER = Boolean(process.env.RENDER || process.env.PORT);
const PORT = Number(process.env.PORT) || 5173;
const HOST = IS_RENDER ? '0.0.0.0' : '127.0.0.1';
const NGROK_PATHS = [
  path.join(__dirname, 'ngrok.exe'),
  'C:\\Users\\user\\Desktop\\BinanceAlgoBot_Tek_Klasor\\ngrok.exe'
];
const CLOUDFLARED_PATH = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\tools\\cloudflared.exe';
const NGROK_DOMAIN = 'https://phoniness-unmasked-rebalance.ngrok-free.dev';
const NGROK_TOKEN = '3KyP14SPEePXkiqxHUFyyZGgGG0_uYh81BWzB2ka1p9V3U6n';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, service: 'hece-zinciri-pro' }));
      return;
    }
    if (pathname === '/') pathname = '/index.html';

    let filePath = path.join(DIST_DIR, pathname);
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const raw = fs.readFileSync(filePath);

    const headers = {
      'Content-Type': contentType,
      'Cache-Control':
        ext === '.html' || pathname.endsWith('sw.js')
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=31536000, immutable'
    };

    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (
      acceptEncoding.includes('gzip') &&
      (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json')
    ) {
      const compressed = zlib.gzipSync(raw);
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(compressed);
    } else {
      res.writeHead(200, headers);
      res.end(raw);
    }
  } catch {
    res.writeHead(500);
    res.end('Server Error');
  }
});

function startNgrokWatchdog() {
  const ngrokBin = NGROK_PATHS.find((p) => fs.existsSync(p));
  if (!ngrokBin) return;

  const proc = spawn(
    ngrokBin,
    ['http', `127.0.0.1:${PORT}`, '--url', NGROK_DOMAIN, '--authtoken', NGROK_TOKEN],
    { stdio: 'ignore', windowsHide: true }
  );

  proc.on('exit', () => {
    // Eğer diğer makinedeki kripto botu hala açıksa 10 saniyede bir kontrol edip kapandığı an devralır
    setTimeout(startNgrokWatchdog, 10000);
  });
}

function startCloudflareTunnel() {
  if (!fs.existsSync(CLOUDFLARED_PATH)) return;

  console.log('[CLOUDFLARE] 7/24 HTTPS tuneli baslatiliyor...');
  const cf = spawn(CLOUDFLARED_PATH, ['tunnel', '--url', `http://127.0.0.1:${PORT}`], {
    windowsHide: true
  });

  const handleOutput = (data) => {
    const str = data.toString();
    const match = str.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      const url = match[0];
      console.log(`[CLOUDFLARE CANLI LINK] ${url}`);
      try {
        fs.writeFileSync(path.join(__dirname, 'tunnel_url.txt'), url, 'utf8');
      } catch {
        // ignore
      }
    }
  };

  cf.stdout.on('data', handleOutput);
  cf.stderr.on('data', handleOutput);

  cf.on('exit', () => {
    setTimeout(startCloudflareTunnel, 5000);
  });
}

server.listen(PORT, HOST, () => {
  console.log(`[HECE ZINCIRI PRO] Sunucu aktif: http://${HOST}:${PORT}/`);
  if (!IS_RENDER) {
    console.log(`[SABIT NGROK HEDEF] ${NGROK_DOMAIN}`);
    startNgrokWatchdog();
    startCloudflareTunnel();
  }
});
