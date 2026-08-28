const express = require('express');
const router = express.Router();
const { dbAdapter } = require('../supabase');
const { requireAdmin } = require('../auth');

// GET /api/admin/stats - Real-time KPI dashboard metrics
router.get('/', requireAdmin, async (req, res) => {
  try {
    const stats = await dbAdapter.getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
