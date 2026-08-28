const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, 'restaurant.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance & concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_veg INTEGER DEFAULT 1, -- 1: Veg, 0: Non-Veg
      full_price REAL NOT NULL,
      has_half_price INTEGER DEFAULT 0, -- 1: Yes, 0: No
      half_price REAL DEFAULT NULL,
      image_url TEXT DEFAULT '',
      is_available INTEGER DEFAULT 1, -- 1: Available, 0: Unavailable
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_identifier TEXT NOT NULL, -- Table number or Customer name
      status TEXT NOT NULL DEFAULT 'new', -- 'new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
      total_amount REAL NOT NULL,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      portion TEXT NOT NULL DEFAULT 'full', -- 'full' or 'half'
      is_veg INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin if none exists
  const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (checkAdmin.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('Seeded default admin user (username: admin, password: admin123)');
  }

  // Seed initial categories & menu items if empty
  const checkCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (checkCategories.count === 0) {
    seedRockOnCafeMenu();
  }
}

function seedRockOnCafeMenu() {
  console.log('Seeding Rock On Cafe menu items & categories...');

  const categories = [
    { name: 'Starters & Appetizers', order: 1 },
    { name: 'Burgers, Pizzas & Rolls', order: 2 },
    { name: 'Main Course & Platters', order: 3 },
    { name: 'Rice, Biryani & Breads', order: 4 },
    { name: 'Rockin\' Shakes & Beverages', order: 5 },
    { name: 'Desserts & Sweet Treats', order: 6 }
  ];

  const insertCategory = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)');
  const catMap = {};

  for (const cat of categories) {
    const info = insertCategory.run(cat.name, cat.order);
    catMap[cat.name] = info.lastInsertRowid;
  }

  const menuItems = [
    // Starters & Appetizers
    {
      category: 'Starters & Appetizers',
      name: 'Crispy Peri-Peri Fries',
      description: 'Golden crunchy potato fries tossed in fiery house peri-peri spice mix, served with garlic dip.',
      is_veg: 1,
      full_price: 160,
      has_half_price: 1,
      half_price: 95,
      image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Starters & Appetizers',
      name: 'Loaded Nachos Grande',
      description: 'Crispy tortilla chips smothered in melted cheddar cheese, fresh jalapeños, salsa, and sour cream.',
      is_veg: 1,
      full_price: 240,
      has_half_price: 1,
      half_price: 140,
      image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Starters & Appetizers',
      name: 'Smoky BBQ Chicken Wings',
      description: 'Succulent chicken wings glazed in slow-cooked smoky hickory BBQ sauce with sesame seeds.',
      is_veg: 0,
      full_price: 290,
      has_half_price: 1,
      half_price: 165,
      image_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Starters & Appetizers',
      name: 'Paneer Tikka Dynamite',
      description: 'Marinated cottage cheese cubes roasted in tandoor with bell peppers and mint chutney.',
      is_veg: 1,
      full_price: 260,
      has_half_price: 1,
      half_price: 150,
      image_url: 'https://images.unsplash.com/photo-1567184109411-b28f24419992?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },

    // Burgers, Pizzas & Rolls
    {
      category: 'Burgers, Pizzas & Rolls',
      name: 'Rockstar Cheesy Burger',
      description: 'Herb patty layered with double cheddar, crisp lettuce, caramelized onions, and secret rock sauce.',
      is_veg: 1,
      full_price: 210,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Burgers, Pizzas & Rolls',
      name: 'Fiery Grilled Chicken Burger',
      description: 'Juicy spiced grilled chicken breast with chipotle mayo, tomato, pickle and melted gouda.',
      is_veg: 0,
      full_price: 260,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Burgers, Pizzas & Rolls',
      name: 'Margherita Basil Pizza',
      description: 'Classic sourdough crust topped with rich San Marzano tomato sauce, fresh mozzarella & basil leaves.',
      is_veg: 1,
      full_price: 350,
      has_half_price: 1,
      half_price: 200,
      image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Burgers, Pizzas & Rolls',
      name: 'Smoked Chicken & Mushroom Pizza',
      description: 'Thin crust loaded with smoked chicken chunks, button mushrooms, black olives, and mozzarella.',
      is_veg: 0,
      full_price: 420,
      has_half_price: 1,
      half_price: 240,
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },

    // Main Course & Platters
    {
      category: 'Main Course & Platters',
      name: 'Paneer Butter Masala',
      description: 'Velvety makhani gravy enriched with butter, kasuri methi, and tender cottage cheese cubes.',
      is_veg: 1,
      full_price: 320,
      has_half_price: 1,
      half_price: 180,
      image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Main Course & Platters',
      name: 'Rock On Special Butter Chicken',
      description: 'Our signature slow-cooked tandoori chicken simmered in rich creamy tomato and cashew gravy.',
      is_veg: 0,
      full_price: 380,
      has_half_price: 1,
      half_price: 220,
      image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Main Course & Platters',
      name: 'Creamy Alfredo Pasta',
      description: 'Fettuccine pasta tossed in luscious parmesan garlic white sauce with fresh broccoli and herbs.',
      is_veg: 1,
      full_price: 290,
      has_half_price: 1,
      half_price: 165,
      image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Main Course & Platters',
      name: 'Dal Makhani Royal',
      description: 'Black lentils slow-cooked overnight with churned butter and cream for authentic rich taste.',
      is_veg: 1,
      full_price: 260,
      has_half_price: 1,
      half_price: 150,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },

    // Rice, Biryani & Breads
    {
      category: 'Rice, Biryani & Breads',
      name: 'Hyderabadi Dum Chicken Biryani',
      description: 'Fragrant long-grain basmati rice layered with spiced chicken, caramelized onions, served with raita.',
      is_veg: 0,
      full_price: 360,
      has_half_price: 1,
      half_price: 200,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Rice, Biryani & Breads',
      name: 'Shahi Veg Dum Biryani',
      description: 'Aromatic basmati rice cooked with fresh seasonal vegetables, paneer, saffron, and aromatic spices.',
      is_veg: 1,
      full_price: 290,
      has_half_price: 1,
      half_price: 165,
      image_url: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Rice, Biryani & Breads',
      name: 'Butter Garlic Naan (2 pcs)',
      description: 'Clay oven baked flatbread infused with roasted garlic flakes and brushed generously with butter.',
      is_veg: 1,
      full_price: 80,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },

    // Rockin' Shakes & Beverages
    {
      category: 'Rockin\' Shakes & Beverages',
      name: 'Oreo Blast Monster Shake',
      description: 'Thick creamy milkshake blended with Oreo cookies, topped with whipped cream and chocolate drizzle.',
      is_veg: 1,
      full_price: 190,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Rockin\' Shakes & Beverages',
      name: 'Fresh Mint Lime Mojito',
      description: 'Zesty sparkling cooler with crushed fresh mint leaves, lime juice, brown sugar, and soda.',
      is_veg: 1,
      full_price: 140,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Rockin\' Shakes & Beverages',
      name: 'Cold Coffee with Ice Cream',
      description: 'Rich blended espresso with chilled milk, crowned with a generous scoop of vanilla bean ice cream.',
      is_veg: 1,
      full_price: 160,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },

    // Desserts & Sweet Treats
    {
      category: 'Desserts & Sweet Treats',
      name: 'Sizzling Hot Chocolate Brownie',
      description: 'Warm fudge walnut brownie served on a sizzler plate with vanilla ice cream and hot chocolate sauce.',
      is_veg: 1,
      full_price: 210,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    },
    {
      category: 'Desserts & Sweet Treats',
      name: 'Gulab Jamun with Rabri (2 pcs)',
      description: 'Soft golden milk dough balls soaked in cardamom saffron syrup, served with creamy thick rabri.',
      is_veg: 1,
      full_price: 150,
      has_half_price: 0,
      half_price: null,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      is_available: 1
    }
  ];

  const insertItem = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, is_veg, full_price, has_half_price, half_price, image_url, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of menuItems) {
    const catId = catMap[item.category] || null;
    insertItem.run(
      catId,
      item.name,
      item.description,
      item.is_veg,
      item.full_price,
      item.has_half_price,
      item.half_price,
      item.image_url,
      item.is_available
    );
  }

  console.log(`Successfully seeded ${menuItems.length} menu items across ${categories.length} categories.`);
}

module.exports = {
  db,
  initDB
};
