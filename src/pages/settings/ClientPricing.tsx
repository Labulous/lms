import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Mock data types
interface Product {
  id: string;
  name: string;
  material: string;
  defaultPrice: number;
}

interface Client {
  id: string;
  name: string;
}

interface ClientPrice {
  productId: string;
  clientId: string;
  price: number;
}

// Mock data
const mockProducts: Product[] = [
  { id: "1", name: "Crown", material: "Zirconia", defaultPrice: 299.99 },
  { id: "2", name: "Bridge", material: "Porcelain", defaultPrice: 399.99 },
  { id: "3", name: "Implant", material: "Titanium", defaultPrice: 599.99 },
];

const mockClients: Client[] = [
  { id: "1", name: "Dental Care Clinic" },
  { id: "2", name: "Smile Perfect" },
  { id: "3", name: "City Dentistry" },
];

const mockClientPrices: ClientPrice[] = [
  { productId: "1", clientId: "1", price: 279.99 },
  { productId: "2", clientId: "1", price: 379.99 },
  { productId: "1", clientId: "2", price: 289.99 },
];

const ClientPricing: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>("default");
  const [editableProducts, setEditableProducts] = useState<Product[]>(mockProducts);
  const [clientPrices, setClientPrices] = useState<ClientPrice[]>(mockClientPrices);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const getClientPrice = (productId: string, clientId: string) => {
    return clientPrices.find(
      (cp) => cp.productId === productId && cp.clientId === clientId
    )?.price;
  };

  const handlePriceChange = (productId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;

    if (selectedClient !== "default") {
      const updatedPrices = [...clientPrices];
      const existingPriceIndex = updatedPrices.findIndex(
        (cp) => cp.productId === productId && cp.clientId === selectedClient
      );

      if (existingPriceIndex >= 0) {
        updatedPrices[existingPriceIndex].price = price;
      } else {
        updatedPrices.push({
          productId,
          clientId: selectedClient,
          price,
        });
      }

      setClientPrices(updatedPrices);
    }
  };

  const handleRemoveClientPrice = (productId: string) => {
    const updatedPrices = clientPrices.filter(
      (cp) => !(cp.productId === productId && cp.clientId === selectedClient)
    );
    setClientPrices(updatedPrices);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableProducts = filteredProducts
        .filter(product => getClientPrice(product.id, selectedClient))
        .map(product => product.id);
      setSelectedProducts(selectableProducts);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleRemoveSelectedPrices = () => {
    const updatedPrices = clientPrices.filter(
      (cp) => !(cp.clientId === selectedClient && selectedProducts.includes(cp.productId))
    );
    setClientPrices(updatedPrices);
    setSelectedProducts([]);
  };

  const filteredProducts = selectedClient !== "default"
    ? editableProducts.filter((product) =>
        clientPrices.some(
          (cp) => cp.productId === product.id && cp.clientId === selectedClient
        )
      )
    : editableProducts;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Client Pricing
          <span className="text-primary">
            – {selectedClient === "default" 
              ? "Default" 
              : mockClients.find((c) => c.id === selectedClient)?.name}
          </span>
        </h1>
        <div className="flex gap-4">
          <Select
            value={selectedClient}
            onValueChange={(value) => setSelectedClient(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {mockClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">Edit Prices</Button>
            </SheetTrigger>
            <SheetContent className="w-[80vw]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Edit Prices
                  {selectedClient !== "default" && (
                    <span className="text-primary">
                      – {mockClients.find((c) => c.id === selectedClient)?.name}
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Make changes to product prices below
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead>Name</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Default Price</TableHead>
                        <TableHead>New Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.material}</TableCell>
                          <TableCell>${product.defaultPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={
                                selectedClient !== "default"
                                  ? getClientPrice(product.id, selectedClient) ??
                                    product.defaultPrice
                                  : product.defaultPrice
                              }
                              onChange={(e) =>
                                handlePriceChange(product.id, e.target.value)
                              }
                              step="0.01"
                              min="0"
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="space-y-4">
        {selectedClient !== "default" && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {selectedProducts.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveSelectedPrices}
                >
                  Remove Selected Prices
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                {selectedClient !== "default" && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        filteredProducts.length > 0 &&
                        filteredProducts.every(
                          product =>
                            !getClientPrice(product.id, selectedClient) ||
                            selectedProducts.includes(product.id)
                        )
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Material</TableHead>
                {selectedClient !== "default" && <TableHead>Client Price</TableHead>}
                <TableHead>Default Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedClient !== "default" && 
               !clientPrices.some(cp => cp.clientId === selectedClient) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {mockClients.find((c) => c.id === selectedClient)?.name} has all of the default prices.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        {getClientPrice(product.id, selectedClient) && (
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked: boolean) => handleSelectProduct(product.id, checked)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.material}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(product.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        $
                        {getClientPrice(product.id, selectedClient)?.toFixed(2) ??
                          product.defaultPrice.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>${product.defaultPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {selectedClient !== "default" && getClientPrice(product.id, selectedClient) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemoveClientPrice(product.id)}
                            >
                              Remove New Price
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ClientPricing;
