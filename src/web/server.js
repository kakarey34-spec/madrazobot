const http = require('http');
const { selfPingUrl, selfPingIntervalMs } = require('../config');

function startSelfPing(url, intervalMs) {
  const healthUrl = `${url.replace(/\/$/, '')}/health`;

  const ping = async () => {
    try {
      const response = await fetch(healthUrl);
      console.log(`Self-ping ${healthUrl} -> ${response.status}`);
    } catch (error) {
      console.error(`Self-ping failed (${healthUrl}):`, error.message);
    }
  };

  setTimeout(ping, 30_000);
  setInterval(ping, intervalMs);
  console.log(`Self-ping enabled every ${intervalMs / 60_000} minutes: ${healthUrl}`);
}

function createWebServer(port) {
  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? '/';

    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (path === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'madrazobot',
        uptime: process.uptime(),
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`Keepalive server listening on port ${port}`);

    if (selfPingUrl) {
      startSelfPing(selfPingUrl, selfPingIntervalMs);
    }
  });

  return server;
}

module.exports = { createWebServer };
