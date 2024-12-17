import React from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Database } from '../../types/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Product = Database['public']['Tables']['products']['Row'] & {
  material: { name: string } | null;
  product_type: { name: string } | null;
  billing_type: { name: string; label: string | null } | null;
};

interface ProductListProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleDelete = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent triggering edit when clicking delete
    onDelete?.(product);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Product Name</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow
            key={product.id}
            className="group cursor-pointer"
            onClick={() => onEdit?.(product)}
          >
            <TableCell>
              <div className="flex items-center">
                <span>{product.name}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
              </div>
              {product.billing_type?.label && (
                <span className="text-sm text-muted-foreground block mt-1">
                  Billing: {product.billing_type.label}
                </span>
              )}
            </TableCell>
            <TableCell>{product.material?.name || '-'}</TableCell>
            <TableCell>{product.product_type?.name || '-'}</TableCell>
            <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
            <TableCell>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(e, product)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete product</span>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductList;