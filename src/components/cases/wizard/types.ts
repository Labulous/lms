import { Product, BillingType } from "@/data/mockProductData";
import { ShadeData } from "./modals/ShadeModal";

export interface SavedProduct extends Product {
  teeth: number[];
  shades: ShadeData;
  discount: number;
}

export interface ProductWithShade extends SavedProduct {
  shade?: ShadeData;
  note: string;
  product_id: string;
}
