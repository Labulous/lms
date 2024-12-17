import { supabase } from '../lib/supabase';
import { createLogger } from '../utils/logger';
import { Database } from '../types/supabase';

const logger = createLogger({ module: 'ProductsService' });

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface ProductInput {
  name: string;
  price: number;
  lead_time?: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  material_id: string;
  product_type_id: string;
  billing_type_id: string;
  requires_shade?: boolean;
}

export type Product = ProductRow;

class ProductsService {
  async getProducts(): Promise<Product[]> {
    try {
      logger.debug('Starting to fetch products from Supabase');
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          material:materials(name),
          product_type:product_types(name),
          billing_type:billing_types(name, label)
        `)
        .order('name');

      if (error) {
        logger.error('Error fetching products from Supabase', { error });
        throw error;
      }

      logger.debug('Raw products from Supabase:', { products });
      return products || [];
    } catch (error) {
      logger.error('Error in getProducts', { error });
      throw error;
    }
  }

  async addProduct(input: ProductInput): Promise<Product> {
    try {
      logger.debug('Adding new product', input);

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: input.name,
          price: input.price,
          lead_time: input.lead_time,
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          material_id: input.material_id,
          product_type_id: input.product_type_id,
          billing_type_id: input.billing_type_id,
          requires_shade: input.requires_shade
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding product', { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in addProduct', { error });
      throw error;
    }
  }

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    try {
      logger.debug('Updating product', { id, input });

      const { data, error } = await supabase
        .from('products')
        .update({
          name: input.name,
          price: input.price,
          lead_time: input.lead_time,
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          material_id: input.material_id,
          product_type_id: input.product_type_id,
          billing_type_id: input.billing_type_id,
          requires_shade: input.requires_shade
        })
        .eq('id', id)
        .select(`
          *,
          material:materials(name),
          product_type:product_types(name),
          billing_type:billing_types(name, label)
        `)
        .single();

      if (error) {
        logger.error('Error updating product', { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in updateProduct', { error });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      logger.debug('Deleting product', { id });

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
}

export const productsService = new ProductsService();
