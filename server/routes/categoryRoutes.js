const express = require('express');
const router = express.Router();
const { dbAdapter } = require('../supabase');
const { requireAdmin } = require('../auth');

// GET /api/categories - Public listing of categories
router.get('/', async (req, res) => {
  try {
    const categories = await dbAdapter.getCategories();
    res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/admin/categories - Create new category
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { name, display_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const orderVal = parseInt(display_order, 10) || 0;
    const category = await dbAdapter.createCategory(name.trim(), orderVal);

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'category_created', category });
    }

    res.status(201).json({ success: true, category });
  } catch (err) {
    if (err.message && err.message.includes('unique')) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id - Update category
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const orderVal = parseInt(display_order, 10) || 0;
    const updated = await dbAdapter.updateCategory(id, name.trim(), orderVal);

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'category_updated', category: updated });
    }

    res.json({ success: true, category: updated });
  } catch (err) {
    if (err.message && err.message.includes('unique')) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id - Delete category
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbAdapter.deleteCategory(id);

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'category_deleted', categoryId: id });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
