import { mockInventoryItems, InventoryItem } from '../data/mockInventoryData';

// ... (keep existing code)

export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockInventoryItems;
};

// ... (keep existing code)