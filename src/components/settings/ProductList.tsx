import React, { useState } from "react";
import {
  Plus,
  MoreVertical,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash,
  Copy,
  ChevronRight,
} from "lucide-react";
import { Database } from "../../types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import BatchProductUpload from "./BatchProductUpload";
import { ProductInput } from "@/services/productsService";

type Product = Database["public"]["Tables"]["products"]["Row"] & {};

type SortConfig = {
  key: keyof Product;
  direction: "asc" | "desc";
};

interface ProductListProps {
  products: Product[];
  productTypes: { id: string; name: string }[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onBatchAdd?: (products: ProductInput[]) => Promise<void>;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  productTypes,
  onEdit,
  onDelete,
  onBatchAdd,
}) => {
  // State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtering
  const getFilteredProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.product_type && typeFilter.includes(product.product_type.name)
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Sorting
  const handleSort = (key: keyof Product) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof Product) => {
    if (sortConfig.key !== key)
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const sortData = (data: Product[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  };

  // Pagination
  const getSortedAndPaginatedData = () => {
    const sortedData = sortData(filteredProducts);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
    return sortedData.slice(startIndex, endIndex);
  };

  // Batch Actions
  const handleBatchDuplicate = () => {
    // Implement duplicate functionality for selected products
  };

  const handleBatchDelete = () => {
    // Implement batch delete functionality for selected products
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {selectedProducts.length > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDuplicate}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Filter by Type</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                  <span className="text-sm font-medium">Filter by Type</span>
                  {typeFilter.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTypeFilter([])}
                      className="h-8 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {productTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={typeFilter.includes(type.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter((prev) => [...prev, type.name]);
                        } else {
                          setTypeFilter((prev) =>
                            prev.filter((t) => t !== type.name)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`type-${type.id}`}
                      className="flex items-center text-sm font-medium cursor-pointer"
                    >
                      <Badge variant={type.name as any} className="ml-1">
                        {type.name}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {onBatchAdd && <BatchProductUpload onUpload={onBatchAdd} />}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    getSortedAndPaginatedData().length > 0 &&
                    getSortedAndPaginatedData().every((product) =>
                      selectedProducts.includes(product.id)
                    )
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts((prev) => [
                        ...prev,
                        ...getSortedAndPaginatedData().map((p) => p.id),
                      ]);
                    } else {
                      setSelectedProducts((prev) =>
                        prev.filter(
                          (id) =>
                            !getSortedAndPaginatedData().find(
                              (p) => p.id === id
                            )
                        )
                      );
                    }
                  }}
                />
              </TableHead>
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center hover:text-primary">
                      Type
                      {getSortIcon("product_type")}
                      {typeFilter.length > 0 && (
                        <Badge variant="filter" className="ml-2">
                          {typeFilter.length}
                        </Badge>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b">
                        <span className="text-sm font-medium">
                          Filter by Type
                        </span>
                        {typeFilter.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTypeFilter([])}
                            className="h-8 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {productTypes.map((type) => (
                        <div
                          key={type.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`type-${type.id}`}
                            checked={typeFilter.includes(type.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTypeFilter((prev) => [...prev, type.name]);
                              } else {
                                setTypeFilter((prev) =>
                                  prev.filter((t) => t !== type.name)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`type-${type.id}`}
                            className="flex items-center text-sm font-medium cursor-pointer"
                          >
                            <Badge variant={type.name as any} className="ml-1">
                              {type.name}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </TableHead>
              <TableHead
                onClick={() => handleSort("material")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Material
                  {getSortIcon("material")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("price")}
                className="cursor-pointer text-right"
              >
                <div className="flex items-center justify-end">
                  Price
                  {getSortIcon("price")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort("billing_type")}
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Billing Type
                  {getSortIcon("billing_type")}
                </div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedAndPaginatedData().map((product) => (
              <TableRow
                key={product.id}
                className={cn(
                  "group cursor-pointer",
                  selectedProducts.includes(product.id) && "bg-muted/50"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts((prev) => [...prev, product.id]);
                      } else {
                        setSelectedProducts((prev) =>
                          prev.filter((id) => id !== product.id)
                        );
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell
                  className="font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(product);
                  }}
                >
                  <div className="flex items-center hover:text-primary cursor-pointer">
                    {product.name}
                    <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableCell>
                <TableCell>
                  {product.product_type && (
                    <Badge variant={product.product_type.name as any}>
                      {product.product_type.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{product.material?.name}</TableCell>
                <TableCell className="text-right">
                  $
                  {product.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{product.billing_type?.label}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(product);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implement duplicate
                        }}
                        className="cursor-pointer"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(product);
                        }}
                        className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
          {filteredProducts.length} products
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  Math.ceil(filteredProducts.length / itemsPerPage),
                  prev + 1
                )
              )
            }
            disabled={
              currentPage === Math.ceil(filteredProducts.length / itemsPerPage)
            }
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.ceil(filteredProducts.length / itemsPerPage))
            }
            disabled={
              currentPage === Math.ceil(filteredProducts.length / itemsPerPage)
            }
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
