const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { dbAdapter } = require('../supabase');
const { requireAdmin } = require('../auth');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dish-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/menu - Public menu
router.get('/', async (req, res) => {
  try {
    const categories = await dbAdapter.getCategories();
    const items = await dbAdapter.getMenuItems();

    res.json({
      categories,
      items
    });
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST /api/admin/menu/upload - Upload dish image
router.post('/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// POST /api/admin/menu - Create menu item
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      is_veg,
      full_price,
      has_half_price,
      half_price,
      image_url,
      is_available
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Food item name is required' });
    }

    const numFullPrice = parseFloat(full_price);
    if (isNaN(numFullPrice) || numFullPrice <= 0) {
      return res.status(400).json({ error: 'Valid full price is required' });
    }

    const hasHalf = (has_half_price === true || has_half_price === 1 || has_half_price === '1') ? 1 : 0;
    let numHalfPrice = null;
    if (hasHalf) {
      numHalfPrice = parseFloat(half_price);
      if (isNaN(numHalfPrice) || numHalfPrice <= 0) {
        return res.status(400).json({ error: 'Valid half price is required when half portion is enabled' });
      }
    }

    const newItem = await dbAdapter.createMenuItem({
      category_id: category_id ? parseInt(category_id, 10) : null,
      name: name.trim(),
      description: description ? description.trim() : '',
      is_veg: (is_veg === 0 || is_veg === false || is_veg === '0') ? 0 : 1,
      full_price: numFullPrice,
      has_half_price: hasHalf,
      half_price: numHalfPrice,
      image_url: image_url ? image_url.trim() : '',
      is_available: (is_available === 0 || is_available === false || is_available === '0') ? 0 : 1
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'item_created', item: newItem });
    }

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error('Error creating menu item:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/admin/menu/:id - Update menu item
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      is_veg,
      full_price,
      has_half_price,
      half_price,
      image_url,
      is_available
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Food item name is required' });
    }

    const numFullPrice = parseFloat(full_price);
    if (isNaN(numFullPrice) || numFullPrice <= 0) {
      return res.status(400).json({ error: 'Valid full price is required' });
    }

    const hasHalf = (has_half_price === true || has_half_price === 1 || has_half_price === '1') ? 1 : 0;
    let numHalfPrice = null;
    if (hasHalf) {
      numHalfPrice = parseFloat(half_price);
      if (isNaN(numHalfPrice) || numHalfPrice <= 0) {
        return res.status(400).json({ error: 'Valid half price is required when half portion is enabled' });
      }
    }

    const updatedItem = await dbAdapter.updateMenuItem(id, {
      category_id: category_id ? parseInt(category_id, 10) : null,
      name: name.trim(),
      description: description !== undefined ? description.trim() : '',
      is_veg: (is_veg === 0 || is_veg === false || is_veg === '0') ? 0 : 1,
      full_price: numFullPrice,
      has_half_price: hasHalf,
      half_price: numHalfPrice,
      image_url: image_url !== undefined ? image_url.trim() : '',
      is_available: (is_available === 0 || is_available === false || is_available === '0') ? 0 : 1
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'item_updated', item: updatedItem });
    }

    res.json({ success: true, item: updatedItem });
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// PATCH /api/admin/menu/:id/availability - Instant toggle available / unavailable
router.patch('/admin/:id/availability', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const availVal = (is_available === 1 || is_available === true || is_available === '1') ? 1 : 0;
    const updated = await dbAdapter.toggleItemAvailability(id, availVal);

    // Instant WebSocket broadcast to all connected customers and admins
    if (req.app.get('io')) {
      req.app.get('io').emit('menu:availability_change', {
        id: updated.id,
        name: updated.name,
        is_available: updated.is_available
      });
    }

    res.json({
      success: true,
      item: updated,
      message: `${updated.name} is now ${availVal === 1 ? 'Available' : 'Unavailable'}`
    });
  } catch (err) {
    console.error('Error toggling availability:', err);
    res.status(500).json({ error: 'Failed to update item availability' });
  }
});

// DELETE /api/admin/menu/:id - Delete menu item
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbAdapter.deleteMenuItem(id);

    if (req.app.get('io')) {
      req.app.get('io').emit('menu:updated', { type: 'item_deleted', itemId: id });
    }

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
