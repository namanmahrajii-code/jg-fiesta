const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbAdapter } = require('../supabase');
const { generateToken, requireAdmin } = require('../auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await dbAdapter.getAdminUser(username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me - Verify active session
router.get('/me', requireAdmin, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;
