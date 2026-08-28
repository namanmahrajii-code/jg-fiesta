const express = require('express');
const router = express.Router();
const { dbAdapter } = require('../supabase');
const { requireAdmin } = require('../auth');

function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ROC-${dateStr}-${randomSuffix}`;
}

// POST /api/orders - Public customer order creation with strict Supabase DB validation
router.post('/', async (req, res) => {
  try {
    const { customer_identifier, items, notes } = req.body;

    // 1. Validate Customer Identifier
    if (!customer_identifier || !customer_identifier.trim()) {
      return res.status(400).json({ error: 'Please provide your Table Number or Customer Name.' });
    }

    // 2. Validate Items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Please add items to place an order.' });
    }

    // 3. Query Database for all referenced items and validate availability + pricing
    const itemIds = items.map(i => parseInt(i.menu_item_id, 10)).filter(Boolean);
    if (itemIds.length !== items.length) {
      return res.status(400).json({ error: 'Invalid items in cart.' });
    }

    const dbItems = await dbAdapter.getMenuItemsByIds(itemIds);
    const dbItemMap = {};
    for (const d of dbItems) {
      dbItemMap[d.id] = d;
    }

    const validatedOrderItems = [];
    let calculatedTotal = 0;

    for (const reqItem of items) {
      const dbItem = dbItemMap[reqItem.menu_item_id];
      if (!dbItem) {
        return res.status(400).json({ error: `Item with ID ${reqItem.menu_item_id} no longer exists.` });
      }

      // Check real-time availability
      if (dbItem.is_available !== 1) {
        return res.status(400).json({
          error: `Sorry, "${dbItem.name}" is currently sold out / unavailable. Please remove it from your cart to proceed.`,
          unavailable_item_id: dbItem.id
        });
      }

      const qty = parseInt(reqItem.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: `Invalid quantity for "${dbItem.name}".` });
      }

      // Determine price strictly from DB based on portion
      const portion = (reqItem.portion === 'half' && dbItem.has_half_price === 1) ? 'half' : 'full';
      const unitPrice = portion === 'half' ? parseFloat(dbItem.half_price) : parseFloat(dbItem.full_price);
      const subtotal = Math.round(unitPrice * qty * 100) / 100;

      calculatedTotal += subtotal;

      validatedOrderItems.push({
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        portion: portion,
        is_veg: dbItem.is_veg,
        unit_price: unitPrice,
        quantity: qty,
        subtotal: subtotal
      });
    }

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;
    const orderId = generateOrderId();

    const orderData = {
      id: orderId,
      customer_identifier: customer_identifier.trim(),
      status: 'new',
      total_amount: calculatedTotal,
      notes: notes ? notes.trim() : ''
    };

    const savedOrder = await dbAdapter.createOrder(orderData, validatedOrderItems);

    // Broadcast new order to Admin Panel via Socket.io
    if (req.app.get('io')) {
      req.app.get('io').emit('order:new', savedOrder);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and sent to the kitchen!',
      order: savedOrder
    });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/:id - Public customer tracking endpoint
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await dbAdapter.getOrder(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (err) {
    console.error('Error fetching order status:', err);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// GET /api/admin/orders - Admin list all orders with filters
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = await dbAdapter.getOrders({ status, search });
    res.json({ orders });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status - Update order status (Admin)
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedOrder = await dbAdapter.updateOrderStatus(id, status);

    // Broadcast status update to Customer and Admin via Socket.io
    if (req.app.get('io')) {
      req.app.get('io').emit('order:status_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        order: updatedOrder
      });
    }

    res.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to "${status}"`
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
