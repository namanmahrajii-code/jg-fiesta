require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing live connection to Supabase:', supabaseUrl);

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (catErr) {
    console.error('Error fetching categories:', catErr);
    process.exit(1);
  }

  console.log(`✅ Successfully connected! Found ${categories.length} categories in Supabase:`);
  categories.forEach(c => console.log(`   - [${c.id}] ${c.name}`));

  const { data: items, error: itemErr } = await supabase
    .from('menu_items')
    .select('*, categories(name)');

  if (itemErr) {
    console.error('Error fetching items:', itemErr);
    process.exit(1);
  }

  console.log(`\n✅ Found ${items.length} dishes in Supabase! Sample: ${items[0]?.name} (₹${items[0]?.full_price})`);
  console.log('\n🎉 SUPABASE LIVE CLOUD CONNECTION IS 100% OPERATIONAL!\n');
}

testSupabase();
