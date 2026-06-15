const express = require('express');
const router = express.Router();

router.get('/assets', (req, res) => {
  res.json([]);
});

router.post('/simulate', (req, res) => {
  res.json({ message: 'Simulation endpoint works' });
});

router.get('/history', (req, res) => {
  res.json([]);
});

module.exports = router;