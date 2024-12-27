import { Product } from "@/data/mockProductData";
import { ProductShades } from "@/data/mockProductData";
export interface SavedProduct extends Product {
  teeth: number[];
  shades: ProductShades;
  discount: number;
}

export interface ProductWithShade extends SavedProduct {
  shade?: ProductShades;
  note: string;
  product_id: string;
  productPrice: number;
}
