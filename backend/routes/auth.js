const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../db');
const router = express.Router();

// ==================== SIGNUP ====================
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // ✅ Even faster hashing (salt rounds = 6)
    const hashed = await bcrypt.hash(password, 6);
    const user = await prisma.user.create({
      data: { username, email, passwordHash: hashed },
      select: { id: true, username: true, email: true }
    });
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== LOGIN (optimised) ====================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.time('[Login] Total');
  console.time('[Login] Find user');

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    console.timeEnd('[Login] Find user');

    if (!user) {
      console.timeEnd('[Login] Total');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.time('[Login] Compare password');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.timeEnd('[Login] Compare password');

    if (!isMatch) {
      console.timeEnd('[Login] Total');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.time('[Login] Sign JWT');
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      console.timeEnd('[Login] Sign JWT');
      console.timeEnd('[Login] Total');
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          virtualBalance: user.virtualBalance,
        },
      });
    });
  } catch (err) {
    console.error(err);
    console.timeEnd('[Login] Total');
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;