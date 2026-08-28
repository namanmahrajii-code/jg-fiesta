// Automated Verification Test Suite for Rock On Cafe Ordering System
const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Rock On Cafe End-to-End Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Menu API
    console.log('--- 1. Testing Menu & Categories API ---');
    const menuRes = await request('/api/menu');
    assert(menuRes.status === 200, 'GET /api/menu returns 200 OK');
    assert(menuRes.data.categories && menuRes.data.categories.length >= 6, 'Menu contains at least 6 categories');
    assert(menuRes.data.items && menuRes.data.items.length >= 20, 'Menu contains at least 20 food items');

    const firstItem = menuRes.data.items[0];
    console.log(`    Sample Item: ${firstItem.name} (₹${firstItem.full_price}, Veg: ${firstItem.is_veg === 1})`);

    // 2. Test Admin Login
    console.log('\n--- 2. Testing Admin Auth API ---');
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrongpassword' }
    });
    assert(invalidLogin.status === 401, 'Invalid password returns 401 Unauthorized');

    const validLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    assert(validLogin.status === 200 && validLogin.data.token, 'Admin login with admin/admin123 returns JWT token');
    const adminToken = validLogin.data.token;
    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Test Order Creation & Server-side Pricing
    console.log('\n--- 3. Testing Order Placement & Anti-Tamper Pricing ---');
    const orderPayload = {
      customer_identifier: 'Table 4 (VIP)',
      notes: 'Please make extra crispy',
      items: [
        { menu_item_id: firstItem.id, portion: 'full', quantity: 2 }
      ]
    };

    const orderRes = await request('/api/orders', {
      method: 'POST',
      body: orderPayload
    });

    assert(orderRes.status === 201, 'POST /api/orders returns 201 Created');
    assert(orderRes.data.order && orderRes.data.order.id.startsWith('ROC-'), 'Order ID starts with ROC- prefix');
    const expectedTotal = firstItem.full_price * 2;
    assert(orderRes.data.order.total_amount === expectedTotal, `Server-side total calculated strictly from DB (Expected ₹${expectedTotal}, Got ₹${orderRes.data.order.total_amount})`);

    const createdOrderId = orderRes.data.order.id;

    // 4. Test Availability Toggle & Order Validation
    console.log('\n--- 4. Testing Real-time Availability Toggle & Rejection ---');
    // Mark first item unavailable
    const toggleOffRes = await request(`/api/menu/admin/${firstItem.id}/availability`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { is_available: 0 }
    });
    assert(toggleOffRes.status === 200 && toggleOffRes.data.item.is_available === 0, `Marked item "${firstItem.name}" as Unavailable (is_available=0)`);

    // Try placing order with unavailable item -> Should reject with 400
    const rejectOrderRes = await request('/api/orders', {
      method: 'POST',
      body: orderPayload
    });
    assert(rejectOrderRes.status === 400, 'Server rejects order containing unavailable item with 400 Bad Request');
    assert(rejectOrderRes.data.error.includes('unavailable') || rejectOrderRes.data.error.includes('sold out'), `Server provides friendly error message: "${rejectOrderRes.data.error}"`);

    // Restore item availability
    const toggleOnRes = await request(`/api/menu/admin/${firstItem.id}/availability`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { is_available: 1 }
    });
    assert(toggleOnRes.status === 200 && toggleOnRes.data.item.is_available === 1, `Restored item "${firstItem.name}" as Available (is_available=1)`);

    // 5. Test Status Progression Workflow
    console.log('\n--- 5. Testing Order Status Progression Workflow ---');
    const statusFlow = ['confirmed', 'preparing', 'ready', 'completed'];

    for (const nextStatus of statusFlow) {
      const updateRes = await request(`/api/orders/admin/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { status: nextStatus }
      });
      assert(updateRes.status === 200 && updateRes.data.order.status === nextStatus, `Updated order status to "${nextStatus}"`);
    }

    // 6. Test Single Order Tracking
    console.log('\n--- 6. Testing Public Order Tracking ---');
    const trackRes = await request(`/api/orders/${createdOrderId}`);
    assert(trackRes.status === 200 && trackRes.data.order.status === 'completed', 'GET /api/orders/:id returns completed order with items');

    // 7. Test Admin Stats
    console.log('\n--- 7. Testing Admin Dashboard KPI Stats ---');
    const statsRes = await request('/api/admin/stats', {
      headers: authHeaders
    });
    assert(statsRes.status === 200, 'GET /api/admin/stats returns 200 OK');
    assert(statsRes.data.today_orders >= 1, `Today's orders count recorded: ${statsRes.data.today_orders}`);
    assert(statsRes.data.today_sales >= expectedTotal, `Today's sales revenue recorded: ₹${statsRes.data.today_sales}`);

    console.log('\n========================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite runtime error:', err);
    process.exit(1);
  }
}

// Start temporary test server if not running, then test
const { initDB } = require('./server/db');
initDB();

const express = require('express');
const httpMod = require('http');
const { Server } = require('socket.io');

const app = express();
const server = httpMod.createServer(app);
const io = new Server(server);
app.set('io', io);
app.use(express.json());
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/categories', require('./server/routes/categoryRoutes'));
app.use('/api/menu', require('./server/routes/menuRoutes'));
app.use('/api/orders', require('./server/routes/orderRoutes'));
app.use('/api/admin/stats', require('./server/routes/statsRoutes'));

server.listen(PORT, async () => {
  try {
    await runTests();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
