# 🎸 Rock On Cafe — Real-Time Restaurant Ordering System

A full-stack restaurant ordering web application built with **Node.js, Express, SQLite (better-sqlite3), and Socket.io**.

Designed with two dedicated, real-time synchronized interfaces:
1. **Customer Ordering Panel** (`/#customer`)
2. **Admin & Kitchen Panel** (`/#admin`)

---

## 🌟 Key Features

### 🍽️ Customer Panel
- **Mouth-Watering Menu**: 20+ pre-seeded dishes across 6 categories (*Starters & Appetizers, Burgers & Pizzas, Main Course, Biryani & Breads, Shakes & Beverages, Desserts*).
- **Dietary Indicators**: Standard Green Dot (Pure Veg) & Brown Triangle (Non-Veg) indicators with one-click filter pills.
- **Portion Customization**: Support for Full and Half portions with automatic price calculation.
- **Instant Availability Sync**: Items marked unavailable by the admin immediately reflect as "Sold Out" on the customer's screen without reloading.
- **Floating Cart & Drawer**: Add/remove dishes, adjust quantities, select Table Number (quick chips Table 1-6 or custom name), add kitchen notes, and view grand total.
- **Duplicate-Safe Order Placement**: Anti-duplicate debounce button prevents accidental double clicks.
- **Live Order Status Tracker**: Unique Order ID (e.g. `#ROC-20260815-1042`) and real-time 5-step kitchen progression:
  `Received ➔ Confirmed ➔ Preparing ➔ Ready to Serve ➔ Completed`

---

### 👑 Admin & Kitchen Panel
- **Secure Authentication**: Protected portal with JWT session tokens and bcrypt password hashing.
  - **Default Username**: `admin`
  - **Default Password**: `admin123`
- **Real-Time Order Feed**: Incoming orders appear immediately with audio chime alerts (synthesized via Web Audio API) and glowing flash notifications.
- **Kitchen Workflow Actions**:
  - `[Confirm Order]` ➔ `[Start Preparing]` ➔ `[Mark Ready to Serve]` ➔ `[Complete & Served]`
  - `[Cancel Order]` option at any stage.
- **Instant 1-Click Availability Toggle**: Switch any dish between **Available** (Green) and **Unavailable** (Gray) with immediate customer-side sync.
- **Full Menu CRUD**: Add, edit, delete dishes with image URL or local file upload, custom pricing, half-portion toggle, and category assignment.
- **Category Management**: Create, edit, and reorder restaurant categories.
- **Live KPI Analytics**: Today's total orders, gross sales revenue (₹), active orders in kitchen, and status breakdown.

---

### 🔒 Server-Side Security & Integrity
- **Anti-Tamper Pricing**: All item prices and subtotals are strictly fetched and calculated from the database, ignoring client-sent price values.
- **Real-Time Pre-Order Availability Check**: Rejects any order containing sold-out dishes with a descriptive error message.
- **Zero Cloud Setup Required**: Self-contained SQLite database with WAL mode enabled (`server/restaurant.db`).

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
cd restaurant-ordering-app
npm install
```

### 2. Start the Server
```bash
npm start
```
or
```bash
node server/index.js
```

### 3. Open in Browser
- **Customer Menu**: [http://localhost:3000](http://localhost:3000) (or `http://localhost:3000/#customer`)
- **Admin Dashboard**: [http://localhost:3000/#admin](http://localhost:3000/#admin)
- **Admin Credentials**: `admin` / `admin123`

---

## 🧪 Testing Real-Time Synchronization
1. Open **Customer Panel** in Window 1: `http://localhost:3000/#customer`
2. Open **Admin Panel** in Window 2: `http://localhost:3000/#admin` and log in with `admin` / `admin123`.
3. In Window 1, add items to cart, select **Table 4**, and click **Send Order to Kitchen**.
4. In Window 2, notice the instant chime and new order card appearing in the **Live Orders** feed.
5. In Window 2, click **Confirm Order** and **Start Preparing** — observe the live stepper in Window 1 immediately advance without refreshing!
6. In Window 2, go to **Menu & Availability** and toggle any item to **Unavailable** — observe the item in Window 1 immediately turn gray with a "Sold Out" badge.
