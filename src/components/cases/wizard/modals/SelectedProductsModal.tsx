import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { ProductShades as ShadeData } from "@/data/mockProductData";

interface ProductWithShade {
  productId: string;
  productName: string;
  price: number;
  discount: number;
  teeth: number[];
  billingType: string;
  shade?: ShadeData;
}

interface SelectedProductsModalProps {
  products: ProductWithShade[];
  onRemoveProduct: (index: number) => void;
  onReviewAndCreate: () => void;
}

const SelectedProductsModal: React.FC<SelectedProductsModalProps> = ({
  products,
  onRemoveProduct,
  onReviewAndCreate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateFinalPrice = (price: number, discount: number): number => {
    return price * (1 - discount / 100);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isExpanded ? "h-[80vh]" : "h-20"
      }`}
    >
      {/* Header/Pull Tab */}
      <div
        className="flex items-center justify-between px-6 py-4 border-t border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">
            Products & Services added to the Case:
            <span className="ml-1 text-blue-600">{products.length}</span>
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {/* Products List */}
      {isExpanded && (
        <div
          className="p-6 overflow-auto"
          style={{ maxHeight: "calc(80vh - 4rem)" }}
        >
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={`${product.productId}-${index}`}
                className="bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">
                      {product.productName}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Billing Type:{" "}
                        <span className="capitalize">
                          {product.billingType}
                        </span>
                      </p>
                      <p>Price: ${product.price.toFixed(2)}</p>
                      {product.discount > 0 && (
                        <p>Discount: {product.discount}%</p>
                      )}
                      <p>
                        Final Price: $
                        {calculateFinalPrice(
                          product.price,
                          product.discount
                        ).toFixed(2)}
                      </p>
                      {product.teeth && product.teeth.length > 0 && (
                        <p>Selected Teeth: {product.teeth.join(", ")}</p>
                      )}
                      <div>
                        <p>Shade:</p>
                        <ul>
                          {Object.entries(product.shade as ShadeData).map(
                            ([key, value]) => (
                              <li key={key}>
                                <strong>{key}:</strong> {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>{" "}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveProduct(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Review and Create Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onReviewAndCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Review and Create Case
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedProductsModal;
