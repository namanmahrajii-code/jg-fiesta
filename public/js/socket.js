// ========================================================
// REAL-TIME SOCKET.IO ENGINE
// Instant bidirectional synchronization between Customer & Admin
// ========================================================

const SocketClient = {
  socket: null,

  init() {
    if (typeof io === 'undefined') {
      console.warn('[Socket] Socket.io client library not loaded yet');
      return;
    }

    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to real-time server with ID:', this.socket.id);
    });

    // Handle New Incoming Order (Admin)
    this.socket.on('order:new', (order) => {
      console.log('[Socket] Received new order event:', order);
      if (window.adminModule) {
        window.adminModule.onNewOrderReceived(order);
      }
    });

    // Handle Order Status Update (Customer & Admin)
    this.socket.on('order:status_update', (data) => {
      console.log('[Socket] Received order status update event:', data);
      
      // Update customer live tracker if viewing this order
      if (window.customerModule) {
        window.customerModule.onOrderStatusUpdated(data);
      }

      // Update admin orders board if active
      if (window.adminModule) {
        window.adminModule.onOrderStatusUpdated(data);
      }
    });

    // Handle Instant Item Availability Change
    this.socket.on('menu:availability_change', (data) => {
      console.log('[Socket] Item availability changed:', data);
      
      // Customer menu reflects instantly
      if (window.customerModule) {
        window.customerModule.onItemAvailabilityChanged(data);
      }

      // Admin menu reflects instantly
      if (window.adminModule) {
        window.adminModule.onItemAvailabilityChanged(data);
      }
    });

    // Handle General Menu/Category Updates
    this.socket.on('menu:updated', (data) => {
      console.log('[Socket] Menu updated:', data);
      if (window.customerModule) {
        window.customerModule.loadMenuData();
      }
      if (window.adminModule && window.adminModule.isAuthenticated) {
        window.adminModule.loadMenuData();
        window.adminModule.loadCategoriesData();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from real-time server. Auto-reconnecting...');
    });
  },

  joinOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('join:order', orderId);
    }
  }
};
