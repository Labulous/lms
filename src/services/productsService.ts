import { supabase } from '../lib/supabase';
import { createLogger } from '../utils/logger';
import { Product, ProductCategory, BillingType } from '../data/mockProductData';

const logger = createLogger({ module: 'ProductsService' });

export interface ProductInput {
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType: BillingType;
  category: ProductCategory;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  leadTime?: number;
  isClientVisible: boolean;
  isTaxable: boolean;
  billingType: BillingType;
  category: ProductCategory;
  requiresShade: boolean;
  material: string;
  type?: string[];
}

class ProductsService {
  async getProducts(): Promise<Product[]> {
    try {
      logger.debug('Starting to fetch products from Supabase');
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error fetching products from Supabase', { error });
        throw error;
      }

      logger.debug('Raw products from Supabase:', { products });

      // Transform the data from database format to application format
      const transformedProducts = (products || []).map(product => {
        // Validate billing type
        const billingType = product.billing_type;
        if (!['perTooth', 'perArch', 'teeth', 'generic', 'calculate'].includes(billingType)) {
          logger.warn('Invalid billing type found', { 
            productId: product.id, 
            productName: product.name, 
            billingType 
          });
        }

        const transformed = {
          id: product.id,
          name: product.name,
          price: product.price,
          leadTime: product.lead_time,
          isClientVisible: product.is_client_visible,
          isTaxable: product.is_taxable,
          billingType: billingType as BillingType,
          category: product.category as ProductCategory,
          requiresShade: product.requires_shade,
          material: product.material,
          type: product.type || [], // Ensure type is always an array
        };

        logger.debug('Transformed product:', transformed);
        return transformed;
      });

      logger.debug('Final transformed products:', { count: transformedProducts.length });
      return transformedProducts;
    } catch (error) {
      logger.error('Error in getProducts', { error });
      throw error;
    }
  }

  async addProduct(productData: ProductInput): Promise<Product> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          price: productData.price,
          lead_time: productData.leadTime,
          is_client_visible: productData.isClientVisible,
          is_taxable: productData.isTaxable,
          billing_type: productData.billingType,
          category: productData.category,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding product', { error });
        throw error;
      }

      return this.transformProductFromDB(product);
    } catch (error) {
      logger.error('Error in addProduct', { error });
      throw error;
    }
  }

  async updateProduct(id: string, productData: ProductInput): Promise<Product> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          price: productData.price,
          lead_time: productData.leadTime,
          is_client_visible: productData.isClientVisible,
          is_taxable: productData.isTaxable,
          billing_type: productData.billingType,
          category: productData.category,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating product', { error });
        throw error;
      }

      return this.transformProductFromDB(product);
    } catch (error) {
      logger.error('Error in updateProduct', { error });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting product', { error });
        throw error;
      }
    } catch (error) {
      logger.error('Error in deleteProduct', { error });
      throw error;
    }
  }

  private transformProductFromDB(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      price: dbProduct.price,
      leadTime: dbProduct.lead_time,
      isClientVisible: dbProduct.is_client_visible,
      isTaxable: dbProduct.is_taxable,
      billingType: dbProduct.billing_type,
      category: dbProduct.category,
      requiresShade: dbProduct.requires_shade,
      material: dbProduct.material,
    };
  }
}

export const productsService = new ProductsService();
