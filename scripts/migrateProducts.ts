import { createClient } from '@supabase/supabase-js';
import { mockProducts } from '../src/data/mockProductData';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateProductsData() {
  try {
    console.log('Starting products data migration');

    // First add the requires_shade column
    const { error: alterError } = await supabase.rpc('exec', {
      query: `
        alter table public.products 
        add column if not exists requires_shade boolean default false;
        
        update public.products
        set requires_shade = true
        where category in ('Zirconia', 'PFM', 'E.Max');
      `
    });

    if (alterError) {
      console.error('Error altering table:', alterError);
      throw alterError;
    }

    // Clear existing products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .gte('created_at', '2000-01-01');

    if (deleteError) {
      console.error('Error clearing products:', deleteError);
      throw deleteError;
    }
    console.log('Existing products cleared');

    // Insert new products
    for (const product of mockProducts) {
      try {
        const productData = {
          id: uuidv4(),
          name: product.name,
          price: product.price,
          lead_time: product.leadTime,
          is_client_visible: product.isClientVisible,
          is_taxable: product.isTaxable,
          billing_type: product.billingType,
          category: product.category,
          requires_shade: product.requiresShade || ['Zirconia', 'PFM', 'E.Max'].includes(product.category)
        };

        console.log('Migrating product:', productData);

        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          console.error('Error inserting product:', error);
          throw error;
        }

        console.log('Successfully migrated product:', product.name);
      } catch (error) {
        console.error('Error migrating product:', product.name, error);
      }
    }

    console.log('Products data migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateProductsData();
