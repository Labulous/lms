import { supabase } from '../lib/supabase';
import { createLogger } from './logger';
import { mockProducts } from '../data/mockProductData';

const logger = createLogger({ module: 'MigrateProductsData' });

export async function migrateProductsData() {
  try {
    logger.info('Starting products data migration');
    let successCount = 0;
    let errorCount = 0;

    for (const product of mockProducts) {
      try {
        const { error } = await supabase
          .from('products')
          .insert({
            id: product.id,
            name: product.name,
            price: product.price,
            lead_time: product.leadTime,
            is_client_visible: product.isClientVisible,
            is_taxable: product.isTaxable,
            billing_type: product.billingType,
            category: product.category,
          });

        if (error) throw error;

        successCount++;
        logger.info('Successfully migrated product', {
          productName: product.name,
          id: product.id,
        });
      } catch (error) {
        errorCount++;
        logger.error('Error migrating product', {
          productName: product.name,
          id: product.id,
          error,
        });
      }
    }

    logger.info('Migration completed', {
      total: mockProducts.length,
      success: successCount,
      error: errorCount,
    });

    return {
      success: successCount,
      error: errorCount,
      total: mockProducts.length,
    };
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  }
}
