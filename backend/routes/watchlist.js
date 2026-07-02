const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /watchlist – user's watchlist
router.get('/', auth, async (req, res) => {
  try {
    const items = await prisma.watchlist.findMany({
      where: { userId: req.user.id },
      include: { asset: true },
      orderBy: { addedAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /watchlist – add asset to watchlist
router.post('/', auth, async (req, res) => {
  const { assetId } = req.body;
  if (!assetId) return res.status(400).json({ error: 'assetId required' });

  try {
    const existing = await prisma.watchlist.findUnique({
      where: { userId_assetId: { userId: req.user.id, assetId } },
    });
    if (existing) return res.status(400).json({ error: 'Already in watchlist' });

    const entry = await prisma.watchlist.create({
      data: { userId: req.user.id, assetId },
      include: { asset: true },
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /watchlist/:id – remove asset from watchlist
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await prisma.watchlist.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });
    if (!entry) return res.status(404).json({ error: 'Not found' });

    await prisma.watchlist.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;