import { format, subDays } from "date-fns";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentQuantity: number;
  safetyLevel: number;
  lastUpdated: string;
  notes?: string;
}

export const mockInventoryItems: InventoryItem[] = [
  {
    id: "INV001",
    name: "Dental Implant Screws",
    category: "Implant Supplies",
    currentQuantity: 150,
    safetyLevel: 50,
    lastUpdated: format(subDays(new Date(), 5), "yyyy-MM-dd"),
  },
  {
    id: "INV002",
    name: "Porcelain Powder",
    category: "Shading",
    currentQuantity: 25,
    safetyLevel: 30,
    lastUpdated: format(subDays(new Date(), 2), "yyyy-MM-dd"),
  },
  {
    id: "INV003",
    name: "Dental Impression Material",
    category: "Impression Supplies",
    currentQuantity: 75,
    safetyLevel: 40,
    lastUpdated: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  },
  {
    id: "INV004",
    name: "Latex Gloves",
    category: "Office Supplies",
    currentQuantity: 500,
    safetyLevel: 200,
    lastUpdated: format(subDays(new Date(), 1), "yyyy-MM-dd"),
  },
  {
    id: "INV005",
    name: "Dental Wax",
    category: "Modeling Supplies",
    currentQuantity: 30,
    safetyLevel: 25,
    lastUpdated: format(subDays(new Date(), 3), "yyyy-MM-dd"),
  },
];

export const getInventoryItemById = (id: string): InventoryItem | undefined => {
  return mockInventoryItems.find((item) => item.id === id);
};
