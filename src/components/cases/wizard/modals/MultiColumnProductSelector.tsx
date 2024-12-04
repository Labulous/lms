import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MaterialType } from '../../../../data/mockProductData';
import { Product } from '../../../../services/productsService';
import { cn } from '@/lib/utils';

interface MultiColumnProductSelectorProps {
  materials: MaterialType[];
  products: Product[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product) => void;
  disabled?: boolean;
  size?: 'default' | 'xs';
}

const MultiColumnProductSelector: React.FC<MultiColumnProductSelectorProps> = ({
  materials,
  products,
  selectedProduct,
  onProductSelect,
  disabled = false,
  size = 'default'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Log props when they change
  useEffect(() => {
    console.log('MultiColumnProductSelector props:', {
      materials,
      productsCount: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        material: p.material,
        type: p.type
      }))
    });
  }, [materials, products]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return products;
    
    return products.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.material?.toLowerCase().includes(query) ||
      (Array.isArray(product.type) && product.type.some(t => t.toLowerCase().includes(query)))
    );
  }, [products, searchQuery]);

  // Group filtered products by material
  const productsByMaterial = useMemo(() => {
    console.log('Grouping products by material:', {
      materials,
      filteredProducts: filteredProducts.map(p => ({
        name: p.name,
        material: p.material
      }))
    });
    
    const grouped = materials.reduce((acc, material) => {
      const materialProducts = filteredProducts.filter(product => {
        const matches = product.material === material;
        console.log(`Material matching for ${product.name}:`, {
          productMaterial: product.material,
          expectedMaterial: material,
          matches
        });
        return matches;
      });
      acc[material] = materialProducts;
      return acc;
    }, {} as Record<MaterialType, Product[]>);

    console.log('Products grouped by material:', 
      Object.fromEntries(
        Object.entries(grouped).map(([material, products]) => 
          [material, products.map(p => p.name)]
        )
      )
    );
    return grouped;
  }, [materials, filteredProducts]);

  // Check if any products are found in the search
  const hasResults = Object.values(productsByMaterial).some(products => products.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            size === 'xs' ? "h-7 text-xs" : "",
            disabled ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={disabled}
        >
          {selectedProduct ? selectedProduct.name : "Select product..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {!hasResults && searchQuery && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No products found for "{searchQuery}"
          </div>
        )}
        <div className="grid grid-cols-4 divide-x h-[400px]">
          {materials.map((material) => (
            <div key={material} className={cn(
              "px-2 py-2",
              productsByMaterial[material].length === 0 && "opacity-50"
            )}>
              <div className="font-medium text-xs mb-2 px-2">
                {material}
                {productsByMaterial[material].length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({productsByMaterial[material].length})
                  </span>
                )}
              </div>
              <ScrollArea className="h-[320px] w-full">
                <div className="space-y-1 p-2">
                  {productsByMaterial[material]?.map((product) => (
                    <Button
                      key={product.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left h-auto py-1.5 px-3 text-xs",
                        selectedProduct?.id === product.id && "bg-blue-50 text-blue-600"
                      )}
                      onClick={() => {
                        onProductSelect(product);
                        setOpen(false);
                      }}
                    >
                      <div className="font-medium">
                        {product.name}
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiColumnProductSelector;
