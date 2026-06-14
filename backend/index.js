const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a catch-all for debugging
app.get('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

module.exports = app;