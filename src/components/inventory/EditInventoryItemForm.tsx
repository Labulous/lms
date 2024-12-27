import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  mockInventoryItems,
  InventoryItem,
} from "../../data/mockInventoryData";

interface InventoryItemFormData {
  name: string;
  category: string;
  currentQuantity: number;
  safetyLevel: number;
  notes: string;
  currentQuantityError?: string;
  safetyLevelError?: string;
}

const EditInventoryItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: "",
    category: "",
    currentQuantity: 0,
    safetyLevel: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<InventoryItemFormData>>({});
  const [loading, setLoading] = useState(true);

  const categories = Array.from(
    new Set(mockInventoryItems.map((item) => item.category))
  );

  useEffect(() => {
    const item = mockInventoryItems.find((item) => item.id === id);
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        currentQuantity: item.currentQuantity,
        safetyLevel: item.safetyLevel,
        notes: item.notes || "",
      });
      setLoading(false);
    } else {
      setErrors({ name: "Item not found" });
      setLoading(false);
    }
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "currentQuantity" || name === "safetyLevel"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<InventoryItemFormData> = {};
    if (!formData.name.trim()) newErrors.name = "Item Name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (formData.currentQuantity < 0)
      newErrors.currentQuantityError =
        "Current Quantity must be a positive number";
    if (formData.safetyLevel < 0)
      newErrors.safetyLevelError = "Safety Level must be a positive number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // In a real application, you would make an API call here to update the item
      console.log("Updated inventory item:", formData);
      // Simulate updating the item in the inventory
      const updatedItem: InventoryItem = {
        id: id!,
        ...formData,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      console.log("Item updated:", updatedItem);
      navigate("/inventory");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Inventory Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Item Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="currentQuantity"
            className="block text-sm font-medium text-gray-700"
          >
            Current Quantity
          </label>
          <input
            type="number"
            id="currentQuantity"
            name="currentQuantity"
            value={formData.currentQuantity}
            onChange={handleInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.currentQuantity && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currentQuantity}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="safetyLevel"
            className="block text-sm font-medium text-gray-700"
          >
            Safety Level
          </label>
          <input
            type="number"
            id="safetyLevel"
            name="safetyLevel"
            value={formData.safetyLevel}
            onChange={handleInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.safetyLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.safetyLevel}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            QR Code
          </label>
          <div className="mt-1 p-2 border rounded-md">
            <QRCodeSVG
              value={`${formData.name}|${formData.category}`}
              size={128}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            QR Code will be updated based on the item name and category
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInventoryItemForm;
