import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MaterialType } from "../../../../data/mockProductData";
import { Product } from "../../../../services/productsService";
import { cn } from "@/lib/utils";

interface MultiColumnProductSelectorProps {
  materials: { id: string; name: string }[];
  products: Product[];
  selectedProduct: { id: string; name: string } | null;
  onProductSelect: (product: Product | any) => void;
  disabled?: boolean;
  size?: "default" | "xs";
  onClick: () => void;
  clientSpecialProducts: { product_id: string; price: number }[] | null;
}

const MultiColumnProductSelector: React.FC<MultiColumnProductSelectorProps> = ({
  materials,
  products,
  selectedProduct,
  onProductSelect,
  disabled = false,
  size = "default",
  onClick,
  clientSpecialProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Filter products based on search query and selected material
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const sortable_material_ids = materials.map((item) => item.id);

    return products
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.material?.name?.toLowerCase().includes(query);

        const matchesMaterial =
          !selectedMaterial || product.material?.name === selectedMaterial.name;

        return matchesSearch && matchesMaterial;
      })
      .sort((a, b) => {
        const indexA = sortable_material_ids.indexOf(a.material?.id ?? "");
        const indexB = sortable_material_ids.indexOf(b.material?.id ?? "");

        return (
          (indexA === -1 ? Infinity : indexA) -
          (indexB === -1 ? Infinity : indexB)
        );
      });
  }, [products, searchQuery, selectedMaterial]);

  // Group products by material for the count
  const productCountByMaterial = useMemo(() => {
    return materials.reduce((acc, material) => {
      acc[material.name] = products.filter(
        (p) => p.material?.name === material.name // compare the 'name' property, not the whole object
      ).length;
      return acc;
    }, {} as Record<string, number>); // assuming `MaterialType` is a string or can be replaced with `string`
  }, [materials, products]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between mr-2 max-w-56",
            size === "xs" ? "h-7 text-xs" : "",
            disabled ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={disabled}
          onClick={() => onClick()}
        >
          {selectedProduct
            ? selectedProduct.name.substring(0, 28) + "..."
            : "Select product..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 " />
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

        <div className="flex divide-x h-[400px]">
          {/* Materials Column (1/3 width) */}
          <div className="w-1/4 p-2 bg-slate-50">
            <div className="font-medium text-sm mb-2 px-2">Materials</div>
            <ScrollArea className="h-[350px]">
              <div className="space-y-1">
                <Button
                  key="all"
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-left h-auto py-2 px-3",
                    !selectedMaterial && "bg-blue-50 text-blue-600"
                  )}
                  onClick={() => setSelectedMaterial(null)}
                >
                  <span>All Materials</span>
                  <span className="text-xs text-muted-foreground">
                    ({products.length})
                  </span>
                </Button>
                {materials.map((material) => (
                  <Button
                    key={material.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left h-auto py-2 px-3",
                      selectedMaterial === material &&
                        "bg-blue-50 text-blue-600"
                    )}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <span>{material.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({productCountByMaterial[material.name]})
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Products Column (2/3 width) */}
          <div className="w-3/4 p-2">
            <div className="font-medium text-sm mb-2 px-2">
              Products
              {filteredProducts.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({filteredProducts.length})
                </span>
              )}
            </div>
            <ScrollArea className="h-[350px]">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? `No products found for "${searchQuery}"`
                    : "No products available"}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1 p-2">
                  {filteredProducts.map((product) => (
                    <Button
                      key={product.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left h-auto py-2 px-3",
                        selectedProduct?.id === product.id &&
                          "bg-blue-50 text-blue-600"
                      )}
                      onClick={() => {
                        onProductSelect(product);
                        setOpen(false);
                      }}
                    >
                      <div className="flex justify-between w-full">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-primary">
                          $
                          {clientSpecialProducts?.filter(
                            (item) => item.product_id === product.id
                          )?.[0]?.price || product.price}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiColumnProductSelector;
