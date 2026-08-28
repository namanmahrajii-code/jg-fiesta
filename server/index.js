require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { dbAdapter } = require('./supabase');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Attach socket.io instance to app for route access
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/ and uploaded images from uploads/
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(__dirname, 'uploads');

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/stats', statsRoutes);

// Catch-all SPA route to serve public/index.html (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Socket.io Real-Time Engine
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Room joining (e.g. for customer tracking a specific order)
  socket.on('join:order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`[Socket] ${socket.id} joined room order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🎸 Rock On Cafe - Ordering System is RUNNING!`);
    console.log(`☁️ Cloud Database: Supabase PostgreSQL Connected`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`👤 Customer Panel: http://localhost:${PORT}/#customer`);
    console.log(`👑 Admin Panel: http://localhost:${PORT}/#admin`);
    console.log(`🔑 Default Admin Credentials: admin / admin123`);
    console.log(`====================================================`);
  });
}

module.exports = app;
