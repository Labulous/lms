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

interface Material {
  id: string;
  name: string;
}

interface ServiceType {
  id: string | null;
  name: string;
  price: number;
  is_taxable: boolean;
  material?: Material;
}

interface MultiColumnServiceSelectorProps {
  materials: MaterialType[];
  services: ServiceType[];
  selectedService: ServiceType | null;
  onServiceSelect: (service: ServiceType | any) => void;
  disabled?: boolean;
  size?: "default" | "xs";
  onClick: () => void;
  clientSpecialServices: { service_id: string; price: number }[] | null;
}

const MultiColumnServiceSelector: React.FC<MultiColumnServiceSelectorProps> = ({
  materials,
  services,
  selectedService,
  onServiceSelect,
  disabled = false,
  size = "default",
  onClick,
  clientSpecialServices,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(
    null
  );
  // Filter products based on search query and selected material
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const sortable_material_ids = [
      "b006eee6-d923-4e97-8b86-2e162e93df9b",
      "48440949-51c9-4495-af13-8ce7076ea2ad",
      "93852615-0d83-4933-b086-1cd89c80237a",
      "75212f1d-7098-475f-8bc3-a35a4626a8be",
      "66b17b2d-cbbc-4f4b-ae25-2bb6a11e821b",
      "b87016e5-5b52-46c6-aeca-4f5895307eab",
      "61e95140-9f3e-453b-9639-171f84abea7a",
      "504def23-c786-4a43-b52f-debae9310fac",
    ];

    return services
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.material?.name?.toLowerCase().includes(query);

        const matchesMaterial =
          !selectedMaterial || product.material?.name === selectedMaterial;

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
  }, [services, searchQuery, selectedMaterial]);

  // Group products by material for the count

  const productCountByMaterial = useMemo(() => {
    return materials.reduce((acc, material) => {
      acc[material] = services.filter(
        (p) => p.material?.name === material
      ).length;
      return acc;
    }, {} as Record<MaterialType, number>);
  }, [materials, services]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            size === "xs" ? "h-7 text-xs" : "",
            disabled ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={disabled}
          onClick={() => onClick()}
        >
          {selectedService ? selectedService.name : "Select service..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
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
                    ({services.length})
                  </span>
                </Button>
                {materials.map((material) => (
                  <Button
                    key={material}
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left h-auto py-2 px-3",
                      selectedMaterial === material &&
                        "bg-blue-50 text-blue-600"
                    )}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    <span>{material}</span>
                    <span className="text-xs text-muted-foreground">
                      ({productCountByMaterial[material]})
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Products Column (2/3 width) */}
          <div className="w-3/4 p-2">
            <div className="font-medium text-sm mb-2 px-2">
              Services
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
                        selectedService?.id === product.id &&
                          "bg-blue-50 text-blue-600"
                      )}
                      onClick={() => {
                        onServiceSelect(product);
                        setOpen(false);
                      }}
                    >
                      <div className="flex justify-between w-full">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-primary">
                          $
                          {clientSpecialServices?.filter(
                            (item) => item.service_id === product.id
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

export default MultiColumnServiceSelector;
