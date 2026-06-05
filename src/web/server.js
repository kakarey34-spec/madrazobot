const express = require('express');
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
  const app = express();

  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'madrazobot',
      uptime: process.uptime(),
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  return app.listen(port, () => {
    console.log(`Health endpoint listening on port ${port}`);

    if (selfPingUrl) {
      startSelfPing(selfPingUrl, selfPingIntervalMs);
    }
  });
}

module.exports = { createWebServer };
