#!/usr/bin/env node
'use strict';
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const TARGET_PORT = process.env.INTERNAL_PORT || 3001;
const LISTEN_PORT = process.env.PORT || 3000;
const LISTEN_HOST = process.env.HOST || '0.0.0.0';
const VAULT_PATH = process.env.VAULT_PATH || 'user-data/demo-vault';
const VAULT_AUTOOPEN = (process.env.VAULT_AUTOOPEN || 'true') !== 'false';

function computeVaultId() {
  if (process.env.VAULT_ID) return process.env.VAULT_ID;
  const resolved = path.resolve(VAULT_PATH);
  return crypto.createHash('sha256').update(resolved).digest('hex').slice(0, 16);
}
const VAULT_ID = computeVaultId();

function proxyRequest(req, res) {
  const proxyReq = http.request(
    { hostname: '127.0.0.1', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end('Bad gateway: ' + err.message);
  });
  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  if (VAULT_AUTOOPEN && req.method === 'GET' && (req.url === '/' || req.url === '/mobile')) {
    res.writeHead(302, { Location: `/vault/${VAULT_ID}` });
    res.end();
    return;
  }
  proxyRequest(req, res);
});

// WebSocket-Durchreichung (z.B. /api/watch für Live-Sync)
server.on('upgrade', (req, clientSocket, head) => {
  const proxyReq = http.request({
    hostname: '127.0.0.1', port: TARGET_PORT, path: req.url, method: req.method, headers: req.headers,
  });
  proxyReq.end();
  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    clientSocket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`[proxy] Öffentlich auf ${LISTEN_HOST}:${LISTEN_PORT}, leitet weiter an 127.0.0.1:${TARGET_PORT}`);
  console.log(`[proxy] Auto-Open ${VAULT_AUTOOPEN ? 'AKTIV' : 'deaktiviert'} → Vault-ID ${VAULT_ID}`);
});
