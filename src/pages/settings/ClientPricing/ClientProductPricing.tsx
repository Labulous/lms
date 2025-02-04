import React, { useEffect, useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useAuth } from "@/contexts/AuthContext";
import { SpecialProductPrices } from "@/types/supabase";
import toast from "react-hot-toast";

// Mock data types
interface Product {
  id: string;
  name: string;
  material: {
    name: string;
  };
  price: number;
  specialPrice: {
    price: number;
  }[];
}

interface Client {
  id: string;
  client_name: string;
}

interface ClientPrice {
  productId: string;
  clientId?: string;
  price: number;
}

// Mock data
// const clients: Client[] = [
//   { id: "1", client_name: "Dental Care Clinic" },
//   { id: "2", client_name: "Smile Perfect" },
//   { id: "3", client_name: "City Dentistry" },
// ];

const ClientProductPricing = ({
  labIdData,
  clients,
}: {
  labIdData: { lab_id: string } | null | undefined;
  clients: Client[] | null | undefined;
}) => {
  const [selectedClient, setSelectedClient] = useState<string>("default");
  const [editableProducts, setEditableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [specialProducts, setSpecialProducts] = useState<
    SpecialProductPrices[]
  >([]);
  const [clientPrices, setClientPrices] = useState<ClientPrice[]>([]);
  const [defaultClientPrices, setDefaultClientPrices] = useState<ClientPrice[]>(
    []
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // const { user } = useAuth();

  const { data: specialProductPrices, error: pricesError } = useQuery(
    labIdData?.lab_id
      ? supabase
          .from("special_product_prices")
          .select(
            `
             *,
             default:products!product_id (
             price,
             name,
             material:materials!material_id (
             name
             )
             )
          `
          )
          .eq("lab_id", labIdData?.lab_id)
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 1000,
    }
  );

  const fetchEditableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
            id, name, price, material:materials!material_id (
            name),
             specialPrice:special_product_prices!id (
            price
            )
    `
        )
        .order("name")
        .eq("lab_id", labIdData?.lab_id);

      console.log(data, error, "datadatadata");
      const products: any = data;
      setEditableProducts(products);
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleFetchSpecialPrices = async () => {
    // Check if selectedClient is not "Default"
    if (selectedClient !== "default") {
      try {
        // Fetch special prices for the selected client
        const { data, error } = await supabase
          .from("special_product_prices")
          .select(
            ` *,
             default:products!product_id (
             price,
             name,
             material:materials!material_id (
             name
             )
             )`
          )
          .eq("client_id", selectedClient); // Assuming selectedClient is the client ID

        if (error) {
          throw new Error(`Error fetching special prices: ${error.message}`);
        }

        // Handle fetched data (e.g., update state or process the data)
        console.log("Fetched special prices:", data);

        // You can set this data in your state, for example:
        console.log(data, "datadata");
        setSpecialProducts(data);
      } catch (error: any) {
        console.error("An error occurred:", error.message);
        toast.error(`Error: ${error.message}`);
      }
    } else {
      return;
    }
  };

  useEffect(() => {
    if (specialProductPrices && specialProductPrices.length > 0) {
      setSpecialProducts(specialProductPrices);
    }
    if (
      specialProductPrices &&
      specialProductPrices.length &&
      editableProducts?.length === 0
    ) {
      const fetchProducts = async () => {
        await fetchEditableProducts();
      };
      fetchProducts();
    }
  }, [specialProductPrices?.length]);

  useEffect(() => {
    if (selectedClient !== "default") {
      handleFetchSpecialPrices();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (
      selectedClient !== "default" &&
      specialProducts &&
      specialProducts?.length > 0 &&
      isDrawerOpen
    ) {
      console.log(specialProducts, "specialProductPricesspecialProductPrices");
      setClientPrices(
        specialProducts.map((item) => ({
          clientId: selectedClient,
          productId: item.product_id,
          price: item.price,
        }))
      );
    }
  }, [isDrawerOpen]);
  console.log(editableProducts, "editable products");
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
    setSelectedProducts((prev) =>
      checked ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableProducts = filteredProducts
        .filter((product) => getClientPrice(product.id, selectedClient))
        .map((product) => product.id);
      setSelectedProducts(selectableProducts);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleRemoveSelectedPrices = () => {
    const updatedPrices = clientPrices.filter(
      (cp) =>
        !(
          cp.clientId === selectedClient &&
          selectedProducts.includes(cp.productId)
        )
    );
    setClientPrices(updatedPrices);
    setSelectedProducts([]);
  };

  const filteredProducts =
    selectedClient !== "default"
      ? editableProducts?.filter((product) =>
          clientPrices.some(
            (cp) =>
              cp.productId === product.id && cp.clientId === selectedClient
          )
        )
      : editableProducts;

  console.log(clientPrices, "client, prices");

  const handleSubmit = async () => {
    if (clientPrices.length === 0 && defaultClientPrices.length === 0) {
      toast.error("Please Update the Prices to Save!!!");
      return;
    }
    try {
      setIsLoading(true);

      if (selectedClient === "default") {
        const updates = defaultClientPrices.map((item) => ({
          id: item.productId,
          price: item.price,
        }));

        for (const item of updates) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ price: item.price })
            .eq("id", item.id);

          if (updateError) {
            throw new Error(
              `Error updating service ID ${item.id}: ${updateError.message}`
            );
          }
        }

        toast.success("Default prices updated successfully!");
        console.log("Updated products successfully:", updates);
        fetchEditableProducts();
        setIsDrawerOpen(false)
      } else {
        // Show loading toast

        const clientId = clientPrices[0].clientId; // Single client ID
        const productPrices = clientPrices.map((item) => ({
          product_id: item.productId,
          client_id: item.clientId,
          price: item.price,
        }));

        // Extract all product IDs
        const productIds = productPrices.map((item) => item.product_id);

        // Fetch existing records for this client
        const { data: existingRecords, error: fetchError } = await supabase
          .from("special_product_prices")
          .select("id, product_id")
          .eq("client_id", clientId)
          .in("product_id", productIds);

        if (fetchError)
          throw new Error(
            `Error fetching existing records: ${fetchError.message}`
          );

        // Create a lookup map of existing product_ids
        const existingMap = new Map(
          existingRecords.map((record) => [record.product_id, record.id])
        );

        // Separate data into updates and inserts
        const updates = [];
        const inserts = [];

        for (const item of productPrices) {
          if (existingMap.has(item.product_id)) {
            // Update existing record
            updates.push({
              id: existingMap.get(item.product_id),
              price: item.price,
            });
          } else {
            // Insert new record
            inserts.push({ ...item });
          }
        }

        // Perform batch updates
        if (updates.length > 0) {
          const { error: updateError } = await supabase
            .from("special_product_prices")
            .upsert(updates);
          if (updateError)
            throw new Error(`Error updating records: ${updateError.message}`);

          // Success Toast for Updates
          toast.success("Records updated successfully!");
          console.log("Updated successfully:", updates);
          setIsDrawerOpen(false);
        }

        // Perform batch inserts
        if (inserts.length > 0) {
          const { error: insertError } = await supabase
            .from("special_product_prices")
            .insert(inserts);
          if (insertError)
            throw new Error(`Error inserting records: ${insertError.message}`);

          // Success Toast for Inserts
          toast.success("Records inserted successfully!");
          setIsDrawerOpen(false);
          console.log("Inserted successfully:", inserts);
        }

        setIsLoading(false);
        setClientPrices([]);
      }
    } catch (error: any) {
      console.error("An error occurred:", error.message);

      // Error Toast
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
      setClientPrices([]);
    } finally {
      handleFetchSpecialPrices();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Client Pricing
          <span className="text-primary">
            –{" "}
            {selectedClient === "default"
              ? "Default"
              : clients?.find((c) => c.id === selectedClient)?.client_name}
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
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet
            open={isDrawerOpen}
            onOpenChange={(value) => {
              if (value === false) {
                setClientPrices([]);
              }
              setIsDrawerOpen(value);
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  editableProducts?.length === 0 && fetchEditableProducts();
                }}
              >
                Edit Prices
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[80vw]">
              <SheetHeader>
                <div className="flex justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    Edit Prices
                    {selectedClient !== "default" && (
                      <span className="text-primary">
                        –{" "}
                        {
                          clients?.find((c) => c.id === selectedClient)
                            ?.client_name
                        }
                      </span>
                    )}
                  </SheetTitle>
                  <Button
                    className="mt-5"
                    disabled={isLoading}
                    onClick={() => handleSubmit()}
                  >
                    {isLoading ? "Saving...." : "Save"}
                  </Button>
                </div>
                <SheetDescription>
                  Make changes to product prices below
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="rounded-md border">
                  <Table className="overflow-y-scroll">
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead>Name</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Default Price</TableHead>
                        <TableHead>New Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="overflow-y-scroll">
                      {editableProducts?.map((product) => (
                        <TableRow
                          key={product.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>{product.material.name}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {selectedClient !== "default" ? (
                              <Input
                                type="number"
                                value={
                                  selectedClient !== "default"
                                    ? getClientPrice(
                                        product.id,
                                        selectedClient
                                      ) ?? product.price
                                    : product.price
                                }
                                onChange={(e) =>
                                  handlePriceChange(product.id, e.target.value)
                                }
                                step="0.01"
                                min="0"
                                className="w-24"
                              />
                            ) : (
                              <Input
                                type="number"
                                placeholder="Ener new"
                                value={
                                  defaultClientPrices.find(
                                    (item) => item.productId === product.id
                                  )?.price || 0
                                }
                                onChange={(e) => {
                                  const newPrice =
                                    parseFloat(e.target.value) || 0;
                                  setDefaultClientPrices((prevPrices) => {
                                    const index = prevPrices.findIndex(
                                      (item) => item.productId === product.id
                                    );
                                    if (index !== -1) {
                                      // Update existing item
                                      const updatedPrices = [...prevPrices];
                                      updatedPrices[index] = {
                                        ...updatedPrices[index],
                                        price: newPrice,
                                      };
                                      return updatedPrices;
                                    } else {
                                      // Add new item
                                      return [
                                        ...prevPrices,
                                        {
                                          productId: product.id,
                                          price: newPrice,
                                        },
                                      ];
                                    }
                                  });
                                }}
                                step="0.01"
                                min="0"
                                className="w-24"
                              />
                            )}
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
                        specialProducts.length > 0 &&
                        filteredProducts?.every(
                          (product) =>
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
                {selectedClient !== "default" && (
                  <TableHead>Client Price</TableHead>
                )}
                <TableHead>Default Price</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedClient !== "default" && specialProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {clients?.find((c) => c.id === selectedClient)?.client_name}{" "}
                    has all of the default prices.
                  </TableCell>
                </TableRow>
              ) : selectedClient !== "default" ? (
                specialProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        {getClientPrice(product.id, selectedClient) && (
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked: boolean) =>
                              handleSelectProduct(product.id, checked)
                            }
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {product.default.name}
                    </TableCell>
                    <TableCell>{product.default.material.name}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(product.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        ${product.price.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>${product.default.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {selectedClient !== "default" &&
                        getClientPrice(product.id, selectedClient) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveClientPrice(product.id)
                                }
                              >
                                Remove New Price
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                editableProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        {getClientPrice(product.id, selectedClient) && (
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked: boolean) =>
                              handleSelectProduct(product.id, checked)
                            }
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.material.name}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(product.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        ${product.price.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {selectedClient !== "default" &&
                        getClientPrice(product.id, selectedClient) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveClientPrice(product.id)
                                }
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

export default ClientProductPricing;
