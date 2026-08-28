// ========================================================
// CUSTOMER ORDERING MODULE
// Complete client-side logic for menu, cart, and live order tracking
// ========================================================

const customerModule = {
  categories: [],
  items: [],
  cart: {}, // { "itemId_portion": { id, itemId, name, portion, unitPrice, qty, isVeg } }
  activeCategory: null,
  dietFilter: 'all', // 'all', 'veg', 'nonveg'
  searchQuery: '',
  activeOrderId: null,
  activeOrderData: null,
  isPlacingOrder: false,

  init() {
    this.loadCartFromStorage();
    this.loadMenuData();
    this.updateCartUI();

    // Check if there was a previously placed order to track
    const savedOrderId = sessionStorage.getItem('rock_last_order_id');
    if (savedOrderId && window.location.hash.startsWith('#order')) {
      this.trackOrder(savedOrderId);
    }
  },

  async loadMenuData() {
    let loadedSuccess = false;
    try {
      const data = await API.getMenu();
      if (data && data.items && data.items.length > 0) {
        this.categories = data.categories || [];
        this.items = data.items || [];
        loadedSuccess = true;
      }
    } catch (err) {
      console.warn('API fetch failed, loading bulletproof menu fallback:', err);
    }

    if (!loadedSuccess || !this.items || this.items.length === 0) {
      const fallback = (typeof FALLBACK_MENU_DATA !== 'undefined') ? FALLBACK_MENU_DATA : {
        categories: [
          { id: 1, name: "Starters & Appetizers", display_order: 1, item_count: 4 },
          { id: 2, name: "Burgers, Pizzas & Rolls", display_order: 2, item_count: 4 },
          { id: 3, name: "Main Course & Platters", display_order: 3, item_count: 4 },
          { id: 4, name: "Rice, Biryani & Breads", display_order: 4, item_count: 3 },
          { id: 5, name: "Rockin' Shakes & Beverages", display_order: 5, item_count: 3 },
          { id: 6, name: "Desserts & Sweet Treats", display_order: 6, item_count: 2 }
        ],
        items: [
          { id: 1, category_id: 1, name: "Crispy Peri Peri Fries", description: "Golden crinkle-cut fries tossed in bold African peri peri spice mix, served with garlic dip.", is_veg: 1, full_price: 180, has_half_price: 1, half_price: 110, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Starters & Appetizers" } },
          { id: 2, category_id: 1, name: "Loaded Cheese Nachos", description: "Tortilla chips loaded with melted cheddar, jalapenos, salsa, sour cream, and olives.", is_veg: 1, full_price: 240, has_half_price: 1, half_price: 140, image_url: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Starters & Appetizers" } },
          { id: 3, category_id: 1, name: "Crispy Honey Chili Potato", description: "Wok-tossed sesame potato fingers glazed with honey, chili sauce, spring onions & garlic.", is_veg: 1, full_price: 220, has_half_price: 1, half_price: 130, image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Starters & Appetizers" } },
          { id: 4, category_id: 1, name: "Tandoori Chicken Tikka", description: "Succulent chicken thigh pieces marinated overnight in yogurt, mustard oil, and kashmiri chili.", is_veg: 0, full_price: 340, has_half_price: 1, half_price: 190, image_url: "https://images.unsplash.com/photo-1567184109411-b28f24419992?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Starters & Appetizers" } },
          { id: 5, category_id: 2, name: "Rockstar Cheesy Burger", description: "Herb patty layered with double cheddar, crisp lettuce, caramelized onions, and secret rock sauce.", is_veg: 1, full_price: 210, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Burgers, Pizzas & Rolls" } },
          { id: 6, category_id: 2, name: "Fiery Grilled Chicken Burger", description: "Juicy spiced grilled chicken breast with chipotle mayo, tomato, pickle and melted gouda.", is_veg: 0, full_price: 260, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Burgers, Pizzas & Rolls" } },
          { id: 7, category_id: 2, name: "Margherita Basil Pizza", description: "Classic sourdough crust topped with rich San Marzano tomato sauce, fresh mozzarella & basil leaves.", is_veg: 1, full_price: 350, has_half_price: 1, half_price: 200, image_url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Burgers, Pizzas & Rolls" } },
          { id: 8, category_id: 2, name: "Smoked Chicken & Mushroom Pizza", description: "Thin crust loaded with smoked chicken chunks, button mushrooms, black olives, and mozzarella.", is_veg: 0, full_price: 420, has_half_price: 1, half_price: 240, image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Burgers, Pizzas & Rolls" } },
          { id: 9, category_id: 3, name: "Paneer Butter Masala", description: "Velvety makhani gravy enriched with butter, kasuri methi, and tender cottage cheese cubes.", is_veg: 1, full_price: 320, has_half_price: 1, half_price: 180, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Main Course & Platters" } },
          { id: 10, category_id: 3, name: "Rock On Special Butter Chicken", description: "Our signature slow-cooked tandoori chicken simmered in rich creamy tomato and cashew gravy.", is_veg: 0, full_price: 380, has_half_price: 1, half_price: 220, image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Main Course & Platters" } },
          { id: 11, category_id: 3, name: "Creamy Alfredo Pasta", description: "Fettuccine pasta tossed in luscious parmesan garlic white sauce with fresh broccoli and herbs.", is_veg: 1, full_price: 290, has_half_price: 1, half_price: 165, image_url: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Main Course & Platters" } },
          { id: 12, category_id: 3, name: "Dal Makhani Royal", description: "Black lentils slow-cooked overnight with churned butter and cream for authentic rich taste.", is_veg: 1, full_price: 260, has_half_price: 1, half_price: 150, image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Main Course & Platters" } },
          { id: 13, category_id: 4, name: "Hyderabadi Dum Chicken Biryani", description: "Fragrant long-grain basmati rice layered with spiced chicken, caramelized onions, served with raita.", is_veg: 0, full_price: 360, has_half_price: 1, half_price: 210, image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rice, Biryani & Breads" } },
          { id: 14, category_id: 4, name: "Subz Veg Dum Biryani", description: "Assorted fresh farm vegetables and paneer cooked with aromatics, mint & saffron basmati rice.", is_veg: 1, full_price: 280, has_half_price: 1, half_price: 160, image_url: "https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rice, Biryani & Breads" } },
          { id: 15, category_id: 4, name: "Butter Garlic Naan Basket (2 pcs)", description: "Leavened oven-baked flatbread brushed with roasted garlic butter and fresh coriander.", is_veg: 1, full_price: 120, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rice, Biryani & Breads" } },
          { id: 16, category_id: 5, name: "Oreo Belgian Chocolate Shake", description: "Thick creamy shake blended with real Belgian cocoa, crunchy Oreo cookies and whipped cream.", is_veg: 1, full_price: 190, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rockin' Shakes & Beverages" } },
          { id: 17, category_id: 5, name: "Fresh Mint Mojito Mocktail", description: "Refreshing muddled fresh mint, lime wedges, sparkling soda, and crushed ice.", is_veg: 1, full_price: 140, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rockin' Shakes & Beverages" } },
          { id: 18, category_id: 5, name: "Cold Coffee with Ice Cream", description: "Rich blended espresso with chilled milk, crowned with a generous scoop of vanilla bean ice cream.", is_veg: 1, full_price: 160, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Rockin' Shakes & Beverages" } },
          { id: 19, category_id: 6, name: "Sizzling Hot Chocolate Brownie", description: "Warm fudge walnut brownie served on a sizzler plate with vanilla ice cream and hot chocolate sauce.", is_veg: 1, full_price: 210, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Desserts & Sweet Treats" } },
          { id: 20, category_id: 6, name: "Gulab Jamun with Rabri (2 pcs)", description: "Soft golden milk dough balls soaked in cardamom saffron syrup, served with creamy thick rabri.", is_veg: 1, full_price: 150, has_half_price: 0, half_price: null, image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80", is_available: 1, categories: { name: "Desserts & Sweet Treats" } }
        ]
      };
      this.categories = fallback.categories;
      this.items = fallback.items;
    }

    try {
      this.renderCategoryNav();
      this.renderMenuGrid();
      this.validateCartAvailability();
    } catch (e) {
      console.error('Error rendering menu grid:', e);
    }
  },

  // Render Category Sticky Pills
  renderCategoryNav() {
    const nav = document.getElementById('category-nav-pills');
    if (!nav) return;

    let html = `
      <button class="cat-pill ${this.activeCategory === null ? 'active' : ''}" onclick="customerModule.selectCategory(null)">
        ✨ All Dishes
      </button>
    `;

    for (const cat of this.categories) {
      const isActive = this.activeCategory === cat.id ? 'active' : '';
      html += `
        <button class="cat-pill ${isActive}" onclick="customerModule.selectCategory(${cat.id})">
          ${cat.name}
        </button>
      `;
    }

    nav.innerHTML = html;
  },

  selectCategory(catId) {
    this.activeCategory = catId;
    this.renderCategoryNav();
    this.renderMenuGrid();
  },

  setDietFilter(filterType) {
    this.dietFilter = filterType;
    document.querySelectorAll('.dietary-filter-pills .filter-pill').forEach(btn => {
      if (btn.dataset.type === filterType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.renderMenuGrid();
  },

  handleSearch(val) {
    this.searchQuery = (val || '').trim().toLowerCase();
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !this.searchQuery);
    }
    this.renderMenuGrid();
  },

  clearSearch() {
    const input = document.getElementById('menu-search-input');
    if (input) input.value = '';
    this.handleSearch('');
  },

  resetFilters() {
    this.activeCategory = null;
    this.dietFilter = 'all';
    this.searchQuery = '';
    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) searchInput.value = '';
    this.setDietFilter('all');
    this.renderCategoryNav();
    this.renderMenuGrid();
  },

  // Render Menu Grid based on active filters
  renderMenuGrid() {
    const grid = document.getElementById('menu-items-grid');
    const emptyState = document.getElementById('menu-empty-state');
    if (!grid) return;

    let filtered = this.items.filter(item => {
      // Category filter
      if (this.activeCategory !== null && item.category_id !== this.activeCategory) {
        return false;
      }
      // Diet filter
      if (this.dietFilter === 'veg' && item.is_veg !== 1) return false;
      if (this.dietFilter === 'nonveg' && item.is_veg === 1) return false;

      // Search query
      if (this.searchQuery) {
        const matchName = (item.name || '').toLowerCase().includes(this.searchQuery);
        const matchDesc = (item.description || '').toLowerCase().includes(this.searchQuery);
        const matchCat = (item.category_name || '').toLowerCase().includes(this.searchQuery);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    let html = '';
    for (const item of filtered) {
      const isUnavailable = item.is_available !== 1;
      const vegIconClass = item.is_veg === 1 ? 'veg-icon' : 'nonveg-icon';
      const imgUrl = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

      let priceDisplay = `₹${item.full_price}`;
      let halfPriceDisplay = '';
      if (item.has_half_price === 1 && item.half_price) {
        halfPriceDisplay = `<span class="price-half-pill">Half: ₹${item.half_price}</span>`;
      }

      html += `
        <div class="dish-card text-only-card ${isUnavailable ? 'unavailable' : ''}" id="dish-card-${item.id}">
          <div class="dish-info">
            <div class="dish-header-row">
              <div class="dish-diet-inline">
                <span class="diet-icon ${vegIconClass}" title="${item.is_veg === 1 ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
              </div>
              <div class="dish-title-group">
                <h3 class="dish-name">${item.name}</h3>
                <span class="dish-category-tag">${item.category_name || 'Rock On Special'}</span>
              </div>
            </div>

            <p class="dish-description">${item.description || ''}</p>

            <div class="dish-footer">
              <div class="dish-pricing">
                <span class="price-main">₹${item.full_price}</span>
                ${halfPriceDisplay}
              </div>

              ${isUnavailable ? `
                <span class="sold-out-badge">Sold Out</span>
              ` : `
                <button 
                  class="add-btn" 
                  onclick="customerModule.handleItemAddClick(${item.id})"
                  title="Add to Order"
                >
                  <span class="plus-sign">＋</span> Add
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;
  },

  // Add Item Click Handler: Shows Portion modal if half is enabled, or directly adds full
  handleItemAddClick(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.is_available !== 1) {
      app.showToast('Sorry, this item is currently unavailable.', 'error');
      return;
    }

    if (item.has_half_price === 1 && item.half_price) {
      this.openPortionModal(item);
    } else {
      this.addToCart(item, 'full');
    }
  },

  openPortionModal(item) {
    const backdrop = document.getElementById('portion-modal-backdrop');
    const title = document.getElementById('portion-modal-title');
    const body = document.getElementById('portion-modal-body');
    if (!backdrop || !body) return;

    title.textContent = `Choose Portion for ${item.name}`;

    body.innerHTML = `
      <div class="portion-option-card" onclick="customerModule.selectPortionAndAdd(${item.id}, 'full')">
        <div>
          <div class="portion-name">Full Portion</div>
          <span class="helper-text">Standard full serving</span>
        </div>
        <div class="portion-price">₹${item.full_price}</div>
      </div>

      <div class="portion-option-card" onclick="customerModule.selectPortionAndAdd(${item.id}, 'half')">
        <div>
          <div class="portion-name">Half Portion</div>
          <span class="helper-text">Single or light serving</span>
        </div>
        <div class="portion-price">₹${item.half_price}</div>
      </div>
    `;

    backdrop.classList.remove('hidden');
  },

  selectPortionAndAdd(itemId, portion) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      this.addToCart(item, portion);
    }
    this.closePortionModal();
  },

  closePortionModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) return;
    const backdrop = document.getElementById('portion-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
  },

  // ========================================================
  // CART OPERATIONS
  // ========================================================
  addToCart(item, portion = 'full') {
    const key = `${item.id}_${portion}`;
    const unitPrice = portion === 'half' ? item.half_price : item.full_price;

    if (this.cart[key]) {
      this.cart[key].quantity += 1;
      this.cart[key].subtotal = Math.round(this.cart[key].quantity * unitPrice * 100) / 100;
    } else {
      this.cart[key] = {
        menu_item_id: item.id,
        item_name: item.name,
        is_veg: item.is_veg,
        portion: portion,
        unit_price: unitPrice,
        quantity: 1,
        subtotal: unitPrice
      };
    }

    this.saveCartToStorage();
    this.updateCartUI();
    app.showToast(`Added ${item.name} (${portion}) to cart!`, 'success');

    // Firebase Analytics Event
    if (typeof window.logFirebaseEvent === 'function') {
      window.logFirebaseEvent('add_to_cart', {
        item_id: item.id,
        item_name: item.name,
        portion: portion,
        price: unitPrice,
        currency: 'INR'
      });
    }
  },

  changeQty(key, delta) {
    if (!this.cart[key]) return;

    this.cart[key].quantity += delta;
    if (this.cart[key].quantity <= 0) {
      delete this.cart[key];
    } else {
      this.cart[key].subtotal = Math.round(this.cart[key].quantity * this.cart[key].unit_price * 100) / 100;
    }

    this.saveCartToStorage();
    this.updateCartUI();
  },

  removeFromCart(key) {
    if (this.cart[key]) {
      const name = this.cart[key].item_name;
      delete this.cart[key];
      this.saveCartToStorage();
      this.updateCartUI();
      app.showToast(`Removed ${name} from cart.`, 'info');
    }
  },

  clearCart() {
    this.cart = {};
    this.saveCartToStorage();
    this.updateCartUI();
  },

  getCartSummary() {
    const keys = Object.keys(this.cart);
    let totalCount = 0;
    let grandTotal = 0;

    for (const key of keys) {
      const item = this.cart[key];
      totalCount += item.quantity;
      grandTotal += item.subtotal;
    }

    grandTotal = Math.round(grandTotal * 100) / 100;

    return {
      items: Object.values(this.cart),
      itemCount: totalCount,
      grandTotal
    };
  },

  updateCartUI() {
    const { items, itemCount, grandTotal } = this.getCartSummary();

    // 1. Header Cart Badge
    const headerCount = document.getElementById('header-cart-count');
    const headerTotal = document.getElementById('header-cart-total');
    if (headerCount) headerCount.textContent = itemCount;
    if (headerTotal) headerTotal.textContent = `₹${grandTotal}`;

    // 2. Floating Mobile Cart Bar
    const floatingBar = document.getElementById('floating-cart-bar');
    const floatingItems = document.getElementById('floating-cart-items-text');
    const floatingTotal = document.getElementById('floating-cart-total-text');

    if (floatingBar) {
      if (itemCount > 0 && app.currentView === 'customer') {
        floatingBar.classList.remove('hidden');
        if (floatingItems) floatingItems.textContent = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
        if (floatingTotal) floatingTotal.textContent = `₹${grandTotal}`;
      } else {
        floatingBar.classList.add('hidden');
      }
    }

    // 3. Cart Drawer Body
    const container = document.getElementById('cart-items-container');
    const emptyView = document.getElementById('cart-empty-view');
    const checkoutSec = document.getElementById('cart-checkout-section');
    const subtotalEl = document.getElementById('cart-subtotal-amount');
    const grandTotalEl = document.getElementById('cart-grand-total-amount');

    if (container) {
      if (items.length === 0) {
        container.innerHTML = '';
        if (emptyView) emptyView.classList.remove('hidden');
        if (checkoutSec) checkoutSec.classList.add('hidden');
      } else {
        if (emptyView) emptyView.classList.add('hidden');
        if (checkoutSec) checkoutSec.classList.remove('hidden');

        let html = '';
        for (const [key, item] of Object.entries(this.cart)) {
          const vegIconClass = item.is_veg === 1 ? 'veg-icon' : 'nonveg-icon';
          html += `
            <div class="cart-item-row" id="cart-row-${key}">
              <div class="cart-item-left">
                <span class="diet-icon ${vegIconClass}" style="margin-top: 3px;"></span>
                <div class="cart-item-details">
                  <span class="cart-item-name">${item.item_name}</span>
                  <div class="cart-item-meta">
                    <span class="portion-tag">${item.portion}</span>
                    <span>₹${item.unit_price} each</span>
                  </div>
                </div>
              </div>

              <div class="cart-item-right">
                <div class="cart-qty-controller">
                  <button type="button" class="qty-btn" onclick="customerModule.changeQty('${key}', -1)">-</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button type="button" class="qty-btn" onclick="customerModule.changeQty('${key}', 1)">+</button>
                </div>
                <div class="cart-item-total">₹${item.subtotal}</div>
                <button type="button" class="cart-remove-btn" onclick="customerModule.removeFromCart('${key}')" title="Remove item">🗑️</button>
              </div>
            </div>
          `;
        }
        container.innerHTML = html;

        if (subtotalEl) subtotalEl.textContent = `₹${grandTotal}`;
        if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;
      }
    }
  },

  openCartDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) {
      backdrop.classList.remove('hidden');
      this.updateCartUI();
    }
  },

  closeCartDrawer(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('close-drawer-btn')) return;
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
  },

  setIdentifier(tableStr) {
    const input = document.getElementById('order-customer-identifier');
    if (input) {
      input.value = tableStr;
      input.focus();
    }
    // Highlight chip
    document.querySelectorAll('.table-chip').forEach(chip => {
      if (chip.textContent.trim() === tableStr) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  },

  saveCartToStorage() {
    try {
      sessionStorage.setItem('rock_customer_cart', JSON.stringify(this.cart));
    } catch (e) {}
  },

  loadCartFromStorage() {
    try {
      const saved = sessionStorage.getItem('rock_customer_cart');
      if (saved) {
        this.cart = JSON.parse(saved);
      }
    } catch (e) {
      this.cart = {};
    }
  },

  validateCartAvailability() {
    // If an item in the cart has been marked unavailable in DB, notify user
    const itemsInCart = Object.values(this.cart);
    let removedAny = false;

    for (const cItem of itemsInCart) {
      const dbItem = this.items.find(i => i.id === cItem.menu_item_id);
      if (dbItem && dbItem.is_available === 0) {
        app.showToast(`Notice: "${cItem.item_name}" is currently sold out and was removed from cart.`, 'error');
        // remove all portions of this item
        delete this.cart[`${cItem.menu_item_id}_full`];
        delete this.cart[`${cItem.menu_item_id}_half`];
        removedAny = true;
      }
    }

    if (removedAny) {
      this.saveCartToStorage();
      this.updateCartUI();
    }
  },

  // ========================================================
  // PLACE ORDER (Duplicate-safe checkout)
  // ========================================================
  async submitOrder() {
    if (this.isPlacingOrder) return; // Prevent double submit

    const identifierInput = document.getElementById('order-customer-identifier');
    const notesInput = document.getElementById('order-special-notes');
    const errorBanner = document.getElementById('order-error-banner');
    const placeBtn = document.getElementById('place-order-btn');
    const spinner = document.getElementById('place-order-spinner');

    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (errorBanner) errorBanner.classList.add('hidden');

    if (!identifier) {
      if (errorBanner) {
        errorBanner.textContent = 'Please enter your Table Number or Name to proceed.';
        errorBanner.classList.remove('hidden');
      }
      if (identifierInput) identifierInput.focus();
      return;
    }

    const { items } = this.getCartSummary();
    if (items.length === 0) {
      if (errorBanner) {
        errorBanner.textContent = 'Your cart is empty. Please add some dishes.';
        errorBanner.classList.remove('hidden');
      }
      return;
    }

    // Lock submission button
    this.isPlacingOrder = true;
    if (placeBtn) placeBtn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');

    try {
      const payload = {
        customer_identifier: identifier,
        notes: notes,
        items: items.map(item => ({
          menu_item_id: item.menu_item_id,
          item_name: item.item_name,
          portion: item.portion,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          is_veg: item.is_veg
        }))
      };

      const result = await API.placeOrder(payload);

      if (result.success && result.order) {
        // Clear cart
        this.clearCart();
        this.closeCartDrawer();

        // Save order ID and track
        sessionStorage.setItem('rock_last_order_id', result.order.id);
        this.activeOrderId = result.order.id;
        this.activeOrderData = result.order;

        // Join real-time socket room for this order
        SocketClient.joinOrderRoom(result.order.id);

        // Firebase Analytics Event
        if (typeof window.logFirebaseEvent === 'function') {
          window.logFirebaseEvent('purchase', {
            transaction_id: result.order.id,
            value: result.order.total_amount,
            currency: 'INR',
            customer_identifier: identifier,
            items_count: items.length
          });
        }

        app.showToast('🎉 Order sent straight to the kitchen!', 'success');
        this.renderOrderTracker(result.order);
        app.navigateTo('order');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      if (errorBanner) {
        errorBanner.textContent = err.message || 'Failed to place order. Please try again.';
        errorBanner.classList.remove('hidden');
      }
      app.showToast(err.message || 'Order failed', 'error');

      // If item was unavailable, refresh menu data
      this.loadMenuData();
    } finally {
      this.isPlacingOrder = false;
      if (placeBtn) placeBtn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
    }
  },

  // ========================================================
  // ORDER TRACKER & LIVE STATUS STEPPER
  // ========================================================
  async trackOrder(orderId) {
    this.activeOrderId = orderId;
    SocketClient.joinOrderRoom(orderId);

    try {
      const data = await API.getOrderStatus(orderId);
      if (data.order) {
        this.activeOrderData = data.order;
        this.renderOrderTracker(data.order);
      }
    } catch (err) {
      console.error('Failed to fetch order status:', err);
    }
  },

  renderOrderTracker(order) {
    const orderIdEl = document.getElementById('tracker-order-id');
    const customerInfoEl = document.getElementById('tracker-customer-info');
    const itemsListEl = document.getElementById('tracker-items-list');
    const totalEl = document.getElementById('tracker-grand-total');

    if (orderIdEl) orderIdEl.textContent = order.id;
    if (customerInfoEl) customerInfoEl.textContent = `📍 ${order.customer_identifier}`;
    if (totalEl) totalEl.textContent = `₹${order.total_amount}`;

    // Render items list
    if (itemsListEl && order.items) {
      let html = '';
      for (const item of order.items) {
        const vegIcon = item.is_veg === 1 ? 'veg-icon' : 'nonveg-icon';
        html += `
          <div class="tracker-item-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="diet-icon ${vegIcon}"></span>
              <span><strong>${item.quantity}x</strong> ${item.item_name} <small class="portion-tag">${item.portion}</small></span>
            </div>
            <span>₹${item.subtotal}</span>
          </div>
        `;
      }
      itemsListEl.innerHTML = html;
    }

    this.updateStepperState(order.status);
  },

  updateStepperState(status) {
    const steps = ['new', 'confirmed', 'preparing', 'ready', 'completed'];
    const statusIndex = steps.indexOf(status);

    const cancelledBanner = document.getElementById('order-cancelled-banner');
    const stepper = document.getElementById('order-stepper');

    if (status === 'cancelled') {
      if (cancelledBanner) cancelledBanner.classList.remove('hidden');
      if (stepper) stepper.style.opacity = '0.4';
      return;
    }

    if (cancelledBanner) cancelledBanner.classList.add('hidden');
    if (stepper) stepper.style.opacity = '1';

    // Update Step Classes
    steps.forEach((st, idx) => {
      const stepEl = document.getElementById(`step-${st}`);
      const lineEl = document.getElementById(`line-${idx}`);

      if (stepEl) {
        stepEl.classList.remove('active', 'done');
        if (idx < statusIndex) {
          stepEl.classList.add('done');
        } else if (idx === statusIndex) {
          stepEl.classList.add('active');
        }
      }

      if (lineEl) {
        lineEl.classList.remove('done');
        if (idx < statusIndex) {
          lineEl.classList.add('done');
        }
      }
    });
  },

  copyOrderId() {
    if (this.activeOrderId) {
      navigator.clipboard.writeText(this.activeOrderId);
      app.showToast('Order ID copied to clipboard!', 'info');
    }
  },

  orderMore() {
    app.navigateTo('customer');
  },

  // ========================================================
  // REAL-TIME EVENT HANDLERS
  // ========================================================
  onItemAvailabilityChanged(data) {
    // 1. Update in-memory item
    const item = this.items.find(i => i.id === data.id);
    if (item) {
      item.is_available = data.is_available;
    }

    // 2. Re-render menu
    this.renderMenuGrid();

    // 3. Show sync notification banner
    const banner = document.getElementById('customer-sync-banner');
    if (banner) {
      banner.querySelector('.sync-text').textContent = `Menu update: "${data.name}" is now ${data.is_available === 1 ? 'Available' : 'Sold Out'}`;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 5000);
    }

    // 4. Validate user's cart
    this.validateCartAvailability();
  },

  onOrderStatusUpdated(data) {
    if (this.activeOrderId && data.orderId === this.activeOrderId) {
      this.activeOrderData = data.order;
      this.updateStepperState(data.status);
      app.showToast(`Kitchen status updated: ${data.status.toUpperCase()}!`, 'info');
    }
  }
};
