

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
