import { SavedProduct } from "@/data/mockProductData";

interface Product {
  id: string;
  name: string;
  price: number;
  lead_time: string | null;
  is_client_visible: boolean;
  is_taxable: boolean;
  created_at: string;
  updated_at: string;
  requires_shade: boolean;
  material: {
    name: string;
    is_active: boolean;
    description: string;
  };
  product_type: {
    name: string;
    is_active: boolean;
    description: string;
  };
  billing_type: {
    name: string;
    label: string;
    is_active: boolean;
    description: string;
  };
  discounted_price: {
    product_id: string;
    discount: number;
    final_price: number;
    price: number;
    quantity: number;
  };
  teethProduct: {
    is_range: boolean;
    tooth_number: number[];
    notes: string;
    product_id: string;
    custom_body_shade: string | null;
    custom_occlusal_shade: string | null;
    custom_gingival_shade: string | null;
    custom_stump_shade: string | null;
    type: string;
    occlusal_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    body_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    gingival_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    stump_shade_id: {
      name: string;
      category: string;
      is_active: boolean;
    };
  };
}

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  lead_time: string | null;
  is_client_visible: boolean;
  is_taxable: boolean;
  created_at: string;
  updated_at: string;
  requires_shade: boolean;
  material: {
    name: string;
    is_active: boolean;
    description: string;
  };
  product_type: {
    name: string;
    is_active: boolean;
    description: string;
  };
  billing_type: {
    name: string;
    label: string;
    is_active: boolean;
    description: string;
  };
  discounted_price: {
    product_id: string;
    discount: number;
    final_price: number;
    price: number;
    quantity: number;
  };
  teethProducts: {
    is_range: boolean;
    tooth_number: number[];
    product_id: string;
    occlusal_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    body_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    gingival_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
    stump_shade: {
      name: string;
      category: string;
      is_active: boolean;
    };
  };
}

export function duplicateProductsByTeeth(
  products: SavedProduct[]
): SavedProduct[] {
  const duplicatedProducts: SavedProduct[] = [];

  // Filter products with id and type
  const validProducts = products.filter((item) => item.id && item.type);

  validProducts.forEach((product) => {
    if (product.teeth && product.teeth.length > 0) {
      product.teeth.forEach((tooth) => {
        duplicatedProducts.push({
          ...product,
          teeth: [tooth], // Create a new product with a single tooth
        });
      });
    } else {
      // If no teeth, push the original product
      duplicatedProducts.push(product);
    }
  });

  return duplicatedProducts;
}
export function duplicateProductsByTeethNumber(products: Product[]): Product[] {
  const duplicatedProducts: Product[] = [];

  products.forEach((product) => {
    const toothNumbers = product.teethProduct?.tooth_number || [];

    if (toothNumbers.length > 0) {
      toothNumbers.forEach((tooth) => {
        duplicatedProducts.push({
          ...product,
          teethProduct: {
            ...product.teethProduct,
            tooth_number: [tooth], // Assign single tooth to the duplicated product
          },
        });
      });
    } else {
      // If no teeth_number, push the original product
      duplicatedProducts.push(product);
    }
  });

  return duplicatedProducts;
}


export function duplicateInvoiceProductsByTeeth(products: any[]): any[] {
  const duplicatedProducts: InvoiceItem[] = [];

  products.forEach((product) => {
    const toothNumbers = product.teethProducts?.tooth_number || [];

    if (toothNumbers.length > 0) {
      toothNumbers.forEach((tooth:any) => {
        duplicatedProducts.push({
          ...product,
          teethProducts: {
            ...product.teethProducts,
            tooth_number: [tooth], // Assign single tooth to the duplicated product
          },
        });
      });
    } else {
      // If no teeth numbers, push the original product
      duplicatedProducts.push(product);
    }
  });

  return duplicatedProducts;
}
