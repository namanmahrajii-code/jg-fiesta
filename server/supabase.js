require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbmggcbpeexzljvwxblo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY || 'sb_secret_H2WSqi0w4chZgjfnvD66NQ_7KD3Ksrh';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_KEY missing in .env. Running in offline/fallback mode.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dbAdapter = {
  isCloud: !!supabase,

  // ========================================================
  // CATEGORIES
  // ========================================================
  async getCategories() {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) throw error;

    // Get item counts per category
    const { data: items } = await supabase
      .from('menu_items')
      .select('category_id');

    const countMap = {};
    if (items) {
      for (const item of items) {
        if (item.category_id) {
          countMap[item.category_id] = (countMap[item.category_id] || 0) + 1;
        }
      }
    }

    return categories.map(c => ({
      ...c,
      item_count: countMap[c.id] || 0
    }));
  },

  async createCategory(name, display_order) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: name.trim(), display_order: display_order || 0 }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(id, name, display_order) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name: name.trim(), display_order: display_order || 0 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    // Unlink menu items first
    await supabase
      .from('menu_items')
      .update({ category_id: null })
      .eq('category_id', id);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ========================================================
  // MENU ITEMS
  // ========================================================
  async getMenuItems() {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .order('id', { ascending: true });

    if (error) throw error;

    return items.map(item => ({
      ...item,
      category_name: item.categories ? item.categories.name : 'Uncategorized'
    }));
  },

  async getMenuItemsByIds(ids) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data;
  },

  async createMenuItem(itemData) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([itemData])
      .select('*, categories(name)')
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.categories ? data.categories.name : 'Uncategorized'
    };
  },

  async updateMenuItem(id, itemData) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...itemData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.categories ? data.categories.name : 'Uncategorized'
    };
  },

  async toggleItemAvailability(id, is_available) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.categories ? data.categories.name : 'Uncategorized'
    };
  },

  async deleteMenuItem(id) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ========================================================
  // ORDERS & ORDER ITEMS
  // ========================================================
  async createOrder(orderData, orderItems) {
    // 1. Insert Order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Insert Order Items
    const itemsToInsert = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsErr) throw itemsErr;

    order.items = items;
    return order;
  },

  async getOrder(id) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error || !order) return null;

    return {
      ...order,
      items: order.order_items || []
    };
  },

  async getOrders(filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(`id.ilike.%${s}%,customer_identifier.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(o => ({
      ...o,
      items: o.order_items || []
    }));
  },

  async updateOrderStatus(id, status) {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();

    if (error) throw error;

    return {
      ...order,
      items: order.order_items || []
    };
  },

  // ========================================================
  // STATS
  // ========================================================
  async getAdminStats() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');

    if (error) throw error;

    const todayStr = new Date().toISOString().slice(0, 10);

    let todayOrders = 0;
    let todaySales = 0;
    let totalSales = 0;

    const countsMap = {
      new: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };

    for (const o of orders) {
      const orderDateStr = new Date(o.created_at).toISOString().slice(0, 10);
      const isToday = orderDateStr === todayStr;
      const numTotal = parseFloat(o.total_amount) || 0;

      if (countsMap[o.status] !== undefined) {
        countsMap[o.status]++;
      }

      if (o.status !== 'cancelled') {
        totalSales += numTotal;
        if (isToday) {
          todaySales += numTotal;
        }
      }

      if (isToday) {
        todayOrders++;
      }
    }

    const activeOrdersCount = countsMap.new + countsMap.confirmed + countsMap.preparing + countsMap.ready;

    return {
      today_orders: todayOrders,
      today_sales: Math.round(todaySales * 100) / 100,
      active_orders: activeOrdersCount,
      total_orders: orders.length,
      total_sales: Math.round(totalSales * 100) / 100,
      status_counts: countsMap
    };
  },

  // ========================================================
  // ADMIN AUTH
  // ========================================================
  async getAdminUser(username) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

module.exports = {
  supabase,
  dbAdapter
};
