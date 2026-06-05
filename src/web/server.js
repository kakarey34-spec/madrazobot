const express = require('express');

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
  });
}

module.exports = { createWebServer };
