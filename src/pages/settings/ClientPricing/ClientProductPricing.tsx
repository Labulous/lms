import React, { useEffect, useState, useMemo } from "react";
import { MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  activeTab,
  setActiveTab,
  selectedClient,
  setSelectedClient,
}: {
  labIdData: { lab_id: string } | null | undefined;
  clients: Client[] | null | undefined;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  selectedClient: string;
  setSelectedClient: React.Dispatch<React.SetStateAction<string>>;
}) => {
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
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mainTableSelectedMaterial, setMainTableSelectedMaterial] = useState<
    string | null
  >(null);
  const [mainTableIsFilterOpen, setMainTableIsFilterOpen] = useState(false);

  const uniqueMaterials = useMemo(() => {
    if (!editableProducts) return [];
    const materials = editableProducts
      .map((product) => product.material?.name)
      .filter(Boolean);
    return Array.from(new Set(materials));
  }, [editableProducts]);

  const filteredProducts = useMemo(() => {
    if (!selectedMaterial) return editableProducts;
    return editableProducts?.filter(
      (product) => product.material?.name === selectedMaterial
    );
  }, [editableProducts, selectedMaterial]);

  const mainTableUniqueMaterials = useMemo(() => {
    if (!editableProducts) return [];
    const materials = editableProducts
      .map((product) => product.material?.name)
      .filter(Boolean);
    return Array.from(new Set(materials));
  }, [editableProducts]);

  const mainTableFilteredProducts = useMemo(() => {
    if (!mainTableSelectedMaterial) return editableProducts;
    return editableProducts?.filter(
      (product) => product.material?.name === mainTableSelectedMaterial
    );
  }, [editableProducts, mainTableSelectedMaterial]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        }
        if (current.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    if (sortConfig.direction === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return null;
  };

  const sortData = (data: any[]) => {
    if (!sortConfig.key || !sortConfig.direction || !data) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === "name") {
        const aName = a.name || (a.default && a.default.name) || "";
        const bName = b.name || (b.default && b.default.name) || "";
        return sortConfig.direction === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      if (sortConfig.key === "material") {
        const aMaterial =
          (a.material && a.material.name) ||
          (a.default && a.default.material && a.default.material.name) ||
          "";
        const bMaterial =
          (b.material && b.material.name) ||
          (b.default && b.default.material && b.default.material.name) ||
          "";
        return sortConfig.direction === "asc"
          ? aMaterial.localeCompare(bMaterial)
          : bMaterial.localeCompare(aMaterial);
      }
      if (sortConfig.key === "price") {
        const aPrice = a.price || (a.default && a.default.price) || 0;
        const bPrice = b.price || (a.default && a.default.price) || 0;
        return sortConfig.direction === "asc"
          ? aPrice - bPrice
          : bPrice - aPrice;
      }
      return 0;
    });
  };

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
          .or("is_archive.is.null,is_archive.eq.false") // Includes null and false values
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
          .eq("client_id", selectedClient) // Assuming selectedClient is the client ID
          .or("is_archive.is.null,is_archive.eq.false"); // Includes null and false values

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
    if (activeTab === "products" && labIdData?.lab_id) {
      fetchEditableProducts();
    }
  }, [activeTab, labIdData?.lab_id]);

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
    } else if (selectedClient !== "default" && isDrawerOpen) {
      // Initialize with empty array when drawer opens but no special prices exist
      setClientPrices([]);
    }
  }, [isDrawerOpen, specialProducts, selectedClient]);

  const getClientPrice = (productId: string, clientId: string) => {
    if (clientId === "default") return null;
    
    // First check in clientPrices (for unsaved changes)
    const clientPrice = clientPrices.find(
      (cp) => cp.productId === productId && cp.clientId === clientId
    );
    
    if (clientPrice !== undefined) {
      return clientPrice.price;
    }
    
    // Then check in specialProducts (from database)
    const specialPrice = specialProducts?.find(
      (item) => item.product_id === productId && item.client_id === clientId
    );
    
    return specialPrice?.price;
  };

  const handlePriceChange = (productId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    
    // Allow empty string (to clear input) or valid numbers
    if (newPrice !== "" && isNaN(price)) return;

    if (selectedClient !== "default") {
      const updatedPrices = [...clientPrices];
      const existingPriceIndex = updatedPrices.findIndex(
        (cp) => cp.productId === productId && cp.clientId === selectedClient
      );

      if (existingPriceIndex >= 0) {
        // If newPrice is empty string, use 0 as the price
        updatedPrices[existingPriceIndex].price = newPrice === "" ? 0 : price;
      } else {
        updatedPrices.push({
          productId,
          clientId: selectedClient,
          price: newPrice === "" ? 0 : price,
        });
      }

      setClientPrices(updatedPrices);
    }
  };

  const saveChanges = async () => {
    try {
      setIsLoading(true);

      // Only process changes for the selected client
      const clientChanges = clientPrices.filter(
        (cp) => cp.clientId === selectedClient
      );

      if (clientChanges.length === 0) {
        toast.success("No changes to save");
        setIsLoading(false);
        return;
      }

      // Process each change
      for (const change of clientChanges) {
        // Check if the special price already exists
        const { data: existingPrice } = await supabase
          .from("special_product_prices")
          .select("*")
          .eq("product_id", change.productId)
          .eq("client_id", selectedClient)
          .single();

        if (existingPrice) {
          // Update existing price
          await supabase
            .from("special_product_prices")
            .update({ price: change.price })
            .eq("product_id", change.productId)
            .eq("client_id", selectedClient);
        } else {
          // Insert new price
          await supabase
            .from("special_product_prices")
            .insert({
              product_id: change.productId,
              client_id: selectedClient,
              price: change.price,
              lab_id: labIdData?.lab_id,
            });
        }
      }

      // Refresh the data
      await handleFetchSpecialPrices();
      toast.success("Changes saved successfully");
      setIsDrawerOpen(false); // Close drawer after saving
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
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
            setIsLoading(false);
            throw new Error(
              `Error updating service ID ${item.id}: ${updateError.message}`
            );
          }
        }

        toast.success("Default prices updated successfully!");
        console.log("Updated products successfully:", updates);
        setIsLoading(false);
        fetchEditableProducts();
        setIsDrawerOpen(false);
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
      setIsLoading(false);
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[300px]">
                <SelectItem value="default">Default</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </ScrollArea>
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
            <SheetContent className="w-[80vw] flex flex-col h-full">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>Edit Prices</SheetTitle>
                <SheetDescription>
                  Update prices for {selectedClient === "default"
                    ? "default"
                    : clients?.find((c) => c.id === selectedClient)?.client_name
                  }
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold">Products</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("name")}
                              className="h-8 p-0 font-medium"
                            >
                              Name
                              {getSortIcon("name")}
                            </Button>
                          </TableHead>
                          <TableHead className="relative">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => handleSort("material")}
                                className="h-8 p-0 font-medium"
                              >
                                Material
                                {getSortIcon("material")}
                              </Button>
                              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsFilterOpen(true);
                                    }}
                                  >
                                    <Filter className="h-4 w-4 z-50" />
                                    {selectedMaterial && (
                                      <span className="ml-2 text-primary text-xs">
                                        (Filtered)
                                      </span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-48 z-50 pointer-events-auto"
                                  align="start"
                                  side="bottom"
                                  sideOffset={5}
                                  style={{ position: 'fixed' }}
                                >
                                  <div className="space-y-2">
                                    <div className="font-medium">Filter by Material</div>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant={!selectedMaterial ? "default" : "outline"}
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMaterial(null);
                                          setIsFilterOpen(false);
                                        }}
                                        className="justify-start"
                                      >
                                        All Materials
                                      </Button>
                                      {uniqueMaterials.map((material) => (
                                        <Button
                                          key={material}
                                          variant={selectedMaterial === material ? "default" : "outline"}
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMaterial(material);
                                            setIsFilterOpen(false);
                                          }}
                                          className="justify-start"
                                        >
                                          {material}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              onClick={() => handleSort("price")}
                              className="h-8 p-0 font-medium"
                            >
                              Default Price
                              {getSortIcon("price")}
                            </Button>
                          </TableHead>
                          <TableHead>New Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="overflow-y-scroll">
                        {(sortConfig.key ? sortData(filteredProducts) : filteredProducts)?.map((product) => {
                          const hasNewPrice =
                            selectedClient !== "default"
                              ? !!getClientPrice(product.id, selectedClient)
                              : !!defaultClientPrices.find(
                                  (item) => item.productId === product.id
                                );

                          return (
                            <TableRow
                              key={product.id}
                              className={cn(
                                "hover:bg-muted/50",
                                selectedClient !== "default" &&
                                  hasNewPrice &&
                                  "bg-blue-50"
                              )}
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
                                      getClientPrice(product.id, selectedClient) ?? ""
                                    }
                                    onChange={(e) =>
                                      handlePriceChange(
                                        product.id,
                                        e.target.value
                                      )
                                    }
                                    step="0.01"
                                    min="0"
                                    placeholder={product.price.toFixed(2)}
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
                                          (item) =>
                                            item.productId === product.id
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="flex pb-2 mb-5 border-b gap-4 text-sm">
        <button
          onClick={() => setActiveTab("products")}
          className={`${
            activeTab === "products" ? "text-primary" : "text-base"
          } relative`}
        >
          Products
          <div className="absolute w-[70px] border border-[#1D4ED8] -bottom-[10px] -right-2"></div>
        </button>
        <button onClick={() => setActiveTab("services")}>Services</button>
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
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="h-8 p-0 font-medium"
                  >
                    Name
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="relative">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("material")}
                      className="h-8 p-0 font-medium"
                    >
                      Material
                      {getSortIcon("material")}
                    </Button>
                    <Popover open={mainTableIsFilterOpen} onOpenChange={setMainTableIsFilterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainTableIsFilterOpen(true);
                          }}
                        >
                          <Filter className="h-4 w-4" />
                          {mainTableSelectedMaterial && (
                            <span className="ml-2 text-primary text-xs">
                              (Filtered)
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 z-[100]"
                        align="start"
                        side="bottom"
                        sideOffset={5}
                        style={{ position: 'fixed' }}
                      >
                        <div className="space-y-2">
                          <div className="font-medium">Filter by Material</div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant={!mainTableSelectedMaterial ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMainTableSelectedMaterial(null);
                                setMainTableIsFilterOpen(false);
                              }}
                              className="justify-start"
                            >
                              All Materials
                            </Button>
                            {mainTableUniqueMaterials.map((material) => (
                              <Button
                                key={material}
                                variant={mainTableSelectedMaterial === material ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMainTableSelectedMaterial(material);
                                  setMainTableIsFilterOpen(false);
                                }}
                                className="justify-start"
                              >
                                {material}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                {selectedClient !== "default" && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("price")}
                      className="h-8 p-0 font-medium"
                    >
                      Client Price
                      {getSortIcon("price")}
                    </Button>
                  </TableHead>
                )}
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("price")}
                    className="h-8 p-0 font-medium"
                  >
                    Default Price
                    {getSortIcon("price")}
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedClient !== "default" && specialProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No special prices found for this client
                  </TableCell>
                </TableRow>
              ) : selectedClient !== "default" ? (
                // Only show products that have special prices for the selected client
                sortData(editableProducts).filter(product => getClientPrice(product.id, selectedClient)).map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectProduct(product.id, checked)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.material?.name}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(product.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        ${getClientPrice(product.id, selectedClient)?.toFixed(2)}
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
              ) : (
                (sortConfig.key ? sortData(mainTableFilteredProducts) : mainTableFilteredProducts)?.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectProduct(product.id, checked)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.material?.name}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(product.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        ${getClientPrice(product.id, selectedClient)?.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                      </Sheet>
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
