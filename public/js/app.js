// ========================================================
// APP CONTROLLER & ROUTER
// View switching, toast alerts, and global app lifecycle
// ========================================================

const app = {
  currentView: 'customer', // 'customer', 'order', 'admin'

  init() {
    console.log('🎸 Rock On Cafe Ordering System Initializing...');

    // Initialize Socket.io
    SocketClient.init();

    // Initialize Modules
    customerModule.init();
    adminModule.init();

    // Setup Hash Route Listener
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash || '#customer';

    if (hash.startsWith('#order/')) {
      const orderId = hash.replace('#order/', '');
      this.navigateTo('order', false);
      if (orderId) {
        customerModule.trackOrder(orderId);
      }
    } else if (hash === '#admin') {
      this.navigateTo('admin', false);
    } else {
      this.navigateTo('customer', false);
    }
  },

  navigateTo(viewName, updateHash = true) {
    this.currentView = viewName;

    if (updateHash) {
      if (viewName === 'order' && customerModule.activeOrderId) {
        window.location.hash = `#order/${customerModule.activeOrderId}`;
      } else if (viewName === 'admin') {
        window.location.hash = '#admin';
      } else {
        window.location.hash = '#customer';
      }
    }

    // Toggle admin-mode on body for CSS control
    document.body.classList.toggle('admin-mode', viewName === 'admin');

    // Toggle View Panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetView = document.getElementById(`${viewName}-view`) || document.getElementById('customer-view');
    if (targetView) targetView.classList.add('active');

    // Update Header Navigation Tabs
    const custBtn = document.getElementById('tab-customer-btn');
    const adminBtn = document.getElementById('tab-admin-btn');
    const headerCartBtn = document.getElementById('header-cart-btn');

    if (custBtn) custBtn.classList.toggle('active', viewName === 'customer' || viewName === 'order');
    if (adminBtn) adminBtn.classList.toggle('active', viewName === 'admin');
    if (headerCartBtn) headerCartBtn.classList.toggle('hidden', viewName === 'admin');

    // Admin quick controls must ONLY be visible when viewing Admin panel
    const adminQuickControls = document.getElementById('admin-quick-controls');
    if (adminQuickControls) {
      adminQuickControls.classList.toggle('hidden', viewName !== 'admin' || !window.adminModule || !window.adminModule.isAuthenticated);
    }

    // Clean professional separation: hide switcher tabs
    const viewTabs = document.querySelector('.view-tabs');
    if (viewTabs) {
      viewTabs.style.display = 'none';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Log Firebase screen view event
    if (typeof window.logFirebaseEvent === 'function') {
      window.logFirebaseEvent('screen_view', { firebase_screen: viewName, screen_name: viewName });
    }

    // Refresh view data if needed
    if (viewName === 'customer') {
      customerModule.updateCartUI();
    } else if (viewName === 'admin' && adminModule.isAuthenticated) {
      adminModule.loadAllAdminData();
    }
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
