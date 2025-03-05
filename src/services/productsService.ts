import { supabase } from "../lib/supabase";
import { createLogger } from "../utils/logger";
import { Database } from "../types/supabase";

const logger = createLogger({ module: "ProductsService" });

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
// type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
// type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export interface ProductInput {
  description: string;
  name: string;
  price: number;
  lead_time?: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  material_id: string;
  product_type_id?: string;
  billing_type_id: string;
  requires_shade?: boolean;
  lab_id: string;
  product_code:string;
}

export interface ProductTypes {
  id: string;
  description: string | null;
  name: string;
}

export type Product = ProductRow;

// Service types
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];

export interface ServiceInput {
  description: string;
  name: string;
  price: number;
  is_client_visible: boolean;
  is_taxable: boolean;
  material_id: string;
  lab_id: string;
}

export type Service = ServiceRow;

class ProductsService {
  async getProducts(labId: string): Promise<Product[]> {
    try {
      logger.debug("Starting to fetch products from Supabase");
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          *,
          material:materials(name),
          product_type:product_types(name),
          billing_type:billing_types(name, label)
        `
        )
        .order("name")
        .eq("lab_id", labId);

      if (error) {
        logger.error("Error fetching products from Supabase", { error });
        throw error;
      }

      logger.debug("Raw products from Supabase:", { products });
      return products || [];
    } catch (error) {
      logger.error("Error in getProducts", { error });
      throw error;
    }
  }

  async getProductTypes(labId: string): Promise<ProductTypes[]> {
    try {
      logger.debug("Starting to fetch products from Supabase");
      const { data: productTypes, error } = await supabase
        .from("product_types")
        .select(
          `
          id,
          description,
          name
        `
        )
        .eq("lab_id", labId);

      if (error) {
        logger.error("Error fetching products from Supabase", { error });
        throw error;
      }

      logger.debug("Raw productTypes from Supabase:", { productTypes });
      return productTypes || [];
    } catch (error) {
      logger.error("Error in getProducts", { error });
      throw error;
    }
  }

  async addProduct(input: ProductInput): Promise<Product> {
    try {
      logger.debug("Adding new product", input);

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: input.name,
          description: input.description || "", // Ensure description is provided
          price: input.price,
          lead_time: input.lead_time || 0, // Default to 0 if no lead_time
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          billing_type_id: input.billing_type_id,
          requires_shade: input.requires_shade || false, // Default to false if no requires_shade
          material_id: input.material_id,
          product_type_id: input.product_type_id || null, // Allow null for product_type_id
          lab_id: input.lab_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error("Error adding product", { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error in addProduct", { error });
      throw error;
    }
  }

  async updateProduct(
    id: string,
    input: Partial<ProductInput>
  ): Promise<Product> {
    try {
      logger.debug("Updating product", { id, input });

      const { data, error } = await supabase
        .from("products")
        .update({
          name: input.name,
          price: input.price,
          lead_time: input.lead_time,
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          material_id: input.material_id,
          product_type_id: input.product_type_id,
          billing_type_id: input.billing_type_id,
          requires_shade: input.requires_shade,
        } as any)
        .eq("id", id)
        .select(
          `
          *,
          material:materials(name),
          product_type:product_types(name),
          billing_type:billing_types(name, label)
        `
        )
        .single();

      if (error) {
        logger.error("Error updating product", { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error in updateProduct", { error });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      logger.debug("Attempting to delete product", { id });

      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        // Log the full error object for debugging
        logger.error("Error deleting product", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Handle foreign key violation
        if (error.code === "23503") {
          // Extract the table name from the error message
          const tableMatch = error.message?.match(/table "([^"]+)"/g);
          const referencingTable =
            tableMatch?.[1]?.replace(/^table "|"$/g, "") || "";

          // Format the table name for display
          const formattedTable = referencingTable
            .replace(/_/g, " ")
            .replace(/case product/i, "case")
            .toLowerCase();

          throw new Error(
            `Cannot delete this product as it is being used in ${formattedTable}`
          );
        }

        // For other errors, throw a generic message
        throw new Error(`Failed to delete product: ${error.message}`);
      }

      logger.debug("Product deleted successfully", { id });
    } catch (error) {
      logger.error("Error in deleteProduct", { error });
      throw error;
    }
  }

  async getMaterials(labId: string) {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("lab_id", labId)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error in getMaterials", { error });
      throw error;
    }
  }

  async createProductType(input: {
    name: string;
    description: string | null;
    lab_id: string;
  }) {
    try {
      const { data, error } = await supabase
        .from("product_types")
        .insert([
          {
            name: input.name.trim(),
            description: input.description?.trim() || null,
            lab_id: input.lab_id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        logger.error("Error creating product type", { error });
        throw error;
      }
      return data;
    } catch (error) {
      logger.error("Error in createProductType", { error });
      throw error;
    }
  }

  async updateProductType(
    id: string,
    input: { name: string; description: string | null }
  ) {
    try {
      const { data, error } = await supabase
        .from("product_types")
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        logger.error("Error updating product type", { error });
        throw error;
      }
      return data;
    } catch (error) {
      logger.error("Error in updateProductType", { error });
      throw error;
    }
  }

  async createMaterial(input: {
    code: string,
    name: string;
    description: string | null;
    lab_id: string;
  }) {
    try {
      const { data, error } = await supabase
        .from("materials")
        .insert([
          {
            code: input.code.trim(),
            name: input.name.trim(),
            description: input.description?.trim() || null,
            lab_id: input.lab_id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

      if (error) {
        logger.error("Error creating material", { error });
        throw error;
      }
      return data;
    } catch (error) {
      logger.error("Error in createMaterial", { error });
      throw error;
    }
  }

  async updateMaterial(
    id: string,
    input: { code: string; name: string; description: string | null }
  ) {
    console.log(id, "id")
    try {
      const { data, error } = await supabase
        .from("materials")
        .update({
          code: input.code.trim(),
          name: input.name.trim(),
          description: input.description?.trim() || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")

      if (error) {
        logger.error("Error updating material", { error });
        throw error;
      }
      console.log(data, "data");
      return data;
    } catch (error) {
      logger.error("Error in updateMaterial", { error });
      throw error;
    }
  }

  async deleteMaterial(id: string) {
    try {
      const { error } = await supabase.from("materials").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      logger.error("Error in deleteMaterial", { error });
      throw error;
    }
  }

  async deleteProductType(id: string): Promise<void> {
    try {
      logger.debug("Attempting to delete product type", { id });

      const { error } = await supabase
        .from("product_types")
        .delete()
        .eq("id", id);

      if (error) {
        // Log the full error object for debugging
        logger.error("Error deleting product type", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Handle foreign key violation
        if (error.code === "23503") {
          throw new Error(
            `Cannot delete this product type as it is being used by existing products`
          );
        }

        // For other errors, throw a generic message
        throw new Error(`Failed to delete product type: ${error.message}`);
      }

      logger.debug("Product type deleted successfully", { id });
    } catch (error) {
      logger.error("Error in deleteProductType", { error });
      throw error;
    }
  }

  // Service-related methods
  async getServices(labId: string): Promise<Service[]> {
    try {
      logger.debug("Starting to fetch services from Supabase");
      const { data: services, error } = await supabase
        .from("services")
        .select(
          `
          *,
          material:materials(name)
        `
        )
        .order("name")
        .eq("lab_id", labId);

      if (error) {
        logger.error("Error fetching services from Supabase", { error });
        throw error;
      }

      logger.debug("Raw services from Supabase:", { services });
      return services || [];
    } catch (error) {
      logger.error("Error in getServices", { error });
      throw error;
    }
  }

  async addService(input: ServiceInput): Promise<Service> {
    try {
      logger.debug("Adding new service", input);

      const { data, error } = await supabase
        .from("services")
        .insert({
          name: input.name,
          description: input.description || "", // Ensure description is provided
          price: input.price,
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          material_id: input.material_id,
          lab_id: input.lab_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error("Error adding service", { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error in addService", { error });
      throw error;
    }
  }

  async updateService(
    id: string,
    input: Partial<ServiceInput>
  ): Promise<Service> {
    try {
      logger.debug("Updating service", { id, input });

      const { data, error } = await supabase
        .from("services")
        .update({
          name: input.name,
          description: input.description,
          price: input.price,
          is_client_visible: input.is_client_visible,
          is_taxable: input.is_taxable,
          material_id: input.material_id,
        })
        .eq("id", id)
        .select(
          `
          *,
          material:materials(name)
        `
        )
        .single();

      if (error) {
        logger.error("Error updating service", { error });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error in updateService", { error });
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      logger.debug("Attempting to delete service", { id });

      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) {
        logger.error("Error deleting service", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        if (error.code === "23503") {
          const tableMatch = error.message?.match(/table "([^"]+)"/g);
          const referencingTable =
            tableMatch?.[1]?.replace(/^table "|"$/g, "") || "";

          const formattedTable = referencingTable
            .replace(/_/g, " ")
            .toLowerCase();

          throw new Error(
            `Cannot delete this service as it is being used in ${formattedTable}`
          );
        }

        throw error;
      }
    } catch (error) {
      logger.error("Error in deleteService", { error });
      throw error;
    }
  }
}

export const productsService = new ProductsService();
