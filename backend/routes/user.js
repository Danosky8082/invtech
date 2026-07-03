const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /user – get current user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, virtualBalance: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /user/profile – update username and email
router.put('/profile', auth, async (req, res) => {
  const { username, email } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { username, email },
      select: { id: true, username: true, email: true }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /user/password – change password
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashed }
    });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;