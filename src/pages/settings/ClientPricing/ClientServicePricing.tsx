import React, { useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useAuth } from "@/contexts/AuthContext";
import { SpecialServicesPrices } from "@/types/supabase";
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
  serviceId: string;
  clientId?: string;
  price: number;
}

// Mock data
// const clients: Client[] = [
//   { id: "1", client_name: "Dental Care Clinic" },
//   { id: "2", client_name: "Smile Perfect" },
//   { id: "3", client_name: "City Dentistry" },
// ];

const ClientServicePricing = ({
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
  const [editableServices, setEditableServices] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [specialProducts, setSpecialProducts] = useState<
    SpecialServicesPrices[]
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

  const uniqueMaterials = useMemo(() => {
    if (!editableServices) return [];
    const materials = editableServices
      .map((product) => product.material?.name)
      .filter(Boolean);
    return Array.from(new Set(materials));
  }, [editableServices]);

  const filteredProducts = useMemo(() => {
    if (!selectedMaterial) return editableServices;
    return editableServices?.filter(
      (product) => product.material?.name === selectedMaterial
    );
  }, [editableServices, selectedMaterial]);
  console.log(filteredProducts, "filteredProducts");
  const { data: specialServicePrices, error: pricesError } = useQuery(
    labIdData?.lab_id
      ? supabase
          .from("special_service_prices")
          .select(
            `
             *,
             default:services!service_id (
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

  const fetchEditableServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
           *,
           material:materials(name)
          `
        )
        .order("name")
        .eq("lab_id", labIdData?.lab_id);

      console.log(data, error, "datadatadata");
      const products: any = data;
      setEditableServices(products);
      setIsLoading(false);
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
          .from("special_service_prices")
          .select(
            ` *,
             default:services!service_id (
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
    if (specialServicePrices && specialServicePrices.length > 0) {
      setSpecialProducts(specialServicePrices);
    }
    if (
      specialServicePrices &&
      specialServicePrices.length &&
      editableServices?.length === 0
    ) {
      const fetchProducts = async () => {
        await fetchEditableServices();
      };
      fetchProducts();
    }
  }, [specialServicePrices?.length]);

  useEffect(() => {
    if (selectedClient !== "default") {
      handleFetchSpecialPrices();
    }
  }, [selectedClient]);
  useEffect(() => {
    if (activeTab === "services") {
      console.log(activeTab, "activeTab");
      fetchEditableServices();
    }
  }, [activeTab]);

  useEffect(() => {
    if (
      selectedClient !== "default" &&
      specialProducts &&
      specialProducts?.length > 0 &&
      isDrawerOpen
    ) {
      console.log(specialProducts, "specialServicePricesspecialServicePrices");
      setClientPrices(
        specialProducts.map((item) => ({
          clientId: selectedClient,
          serviceId: item.service_id,
          price: item.price,
        }))
      );
    } else if (selectedClient !== "default" && isDrawerOpen) {
      // Initialize with empty array when drawer opens but no special prices exist
      setClientPrices([]);
    }
  }, [isDrawerOpen, specialProducts, selectedClient]);
  console.log(editableServices, "editable products");
  // Function to get client price
  const getClientPrice = (serviceId: string, clientId: string) => {
    if (clientId === "default") return null;
    
    // First check in clientPrices (for unsaved changes)
    const clientPrice = clientPrices.find(
      (cp) => cp.serviceId === serviceId && cp.clientId === clientId
    );
    
    if (clientPrice !== undefined) {
      return clientPrice.price;
    }
    
    // Then check in specialProducts (from database)
    const specialPrice = specialProducts?.find(
      (item) => item.service_id === serviceId && item.client_id === clientId
    );
    
    return specialPrice?.price;
  };

  const handlePriceChange = (serviceId: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    
    // Allow empty string (to clear input) or valid numbers
    if (newPrice !== "" && isNaN(price)) return;

    if (selectedClient !== "default") {
      const updatedPrices = [...clientPrices];
      const existingPriceIndex = updatedPrices.findIndex(
        (cp) => cp.serviceId === serviceId && cp.clientId === selectedClient
      );

      if (existingPriceIndex >= 0) {
        // If newPrice is empty string, use 0 as the price
        updatedPrices[existingPriceIndex].price = newPrice === "" ? 0 : price;
      } else {
        updatedPrices.push({
          serviceId,
          clientId: selectedClient,
          price: newPrice === "" ? 0 : price,
        });
      }

      setClientPrices(updatedPrices);
    }
  };

  // Function to save all price changes to the database
  const saveChanges = async () => {
    try {
      setIsLoading(true);
      
      // Only process changes for the selected client
      const clientChanges = clientPrices.filter(
        cp => cp.clientId === selectedClient
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
          .from("special_service_prices")
          .select("*")
          .eq("service_id", change.serviceId)
          .eq("client_id", selectedClient)
          .single();
        
        if (existingPrice) {
          // Update existing price
          await supabase
            .from("special_service_prices")
            .update({ price: change.price })
            .eq("service_id", change.serviceId)
            .eq("client_id", selectedClient);
        } else {
          // Insert new price
          await supabase
            .from("special_service_prices")
            .insert({
              service_id: change.serviceId,
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

  const handleRemoveClientPrice = (serviceId: string) => {
    const updatedPrices = clientPrices.filter(
      (cp) => !(cp.serviceId === serviceId && cp.clientId === selectedClient)
    );
    setClientPrices(updatedPrices);
  };

  const handleSelectProduct = (serviceId: string, checked: boolean) => {
    setSelectedProducts((prev) =>
      checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
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
          selectedProducts.includes(cp.serviceId)
        )
    );
    setClientPrices(updatedPrices);
    setSelectedProducts([]);
  };

  console.log(clientPrices, "client, prices");

  const handleSubmit = async () => {
    if (clientPrices.length === 0 && defaultClientPrices.length === 0) {
      toast.error("Please Update the Prices to Save!!!");
      return;
    }

    try {
      setIsLoading(true);
      console.log(defaultClientPrices, "defaultClientPrices");
      if (selectedClient === "default") {
        // Update `services` table using `defaultClientPrices`
        const updates = defaultClientPrices.map((item) => ({
          id: item.serviceId,
          price: item.price,
        }));

        for (const item of updates) {
          const { data, error: updateError } = await supabase
            .from("services")
            .update({ price: item.price })
            .eq("id", item.id)
            .select("*");

          if (updateError) {
            setIsLoading(false);
            throw new Error(
              `Error updating service ID ${item.id}: ${updateError.message}`
            );
          }
          console.log(data, "data updated pricing");
        }
        toast.success("Default prices updated successfully! hi");
        console.log("Updated services successfully:", updates);
        setIsLoading(false);
        fetchEditableServices();
      } else {
        // Existing logic for updating special_service_prices
        const clientId = clientPrices[0].clientId;
        const productPrices = clientPrices.map((item) => ({
          service_id: item.serviceId,
          client_id: item.clientId,
          price: item.price,
        }));

        const serviceIds = productPrices.map((item) => item.service_id);

        const { data: existingRecords, error: fetchError } = await supabase
          .from("special_service_prices")
          .select("id, service_id")
          .eq("client_id", clientId)
          .in("service_id", serviceIds);

        if (fetchError)
          throw new Error(
            `Error fetching existing records: ${fetchError.message}`
          );

        const existingMap = new Map(
          existingRecords.map((record) => [record.service_id, record.id])
        );

        const updates = [];
        const inserts = [];

        for (const item of productPrices) {
          if (existingMap.has(item.service_id)) {
            updates.push({
              id: existingMap.get(item.service_id),
              price: item.price,
            });
          } else {
            inserts.push({ ...item });
          }
        }

        if (updates.length > 0) {
          const { error: updateError } = await supabase
            .from("special_service_prices")
            .upsert(updates);
          if (updateError)
            throw new Error(`Error updating records: ${updateError.message}`);
          console.log("Updated successfully:", updates);
          setIsLoading(false);
        }

        if (inserts.length > 0) {
          const { error: insertError } = await supabase
            .from("special_service_prices")
            .insert(inserts);
          if (insertError)
            throw new Error(`Error inserting records: ${insertError.message}`);
          console.log("Inserted successfully:", inserts);
        }
        setIsLoading(false);

        toast.success("Records Updated successfully!");
      }

      setIsLoading(false);
      setClientPrices([]);
      setIsDrawerOpen(false);
    } catch (error: any) {
      console.error("An error occurred:", error.message);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
      setClientPrices([]);
    } finally {
      handleFetchSpecialPrices();
    }
  };

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
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === "name") {
        const aName = a.name || (a.default && a.default.name) || "";
        const bName = b.name || (b.default && b.default.name) || "";
        return sortConfig.direction === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      if (sortConfig.key === "material") {
        const aDesc =
          a.material?.name || (a.default && a.default.material?.name) || "";
        const bDesc =
          b.material?.name || (b.default && b.default.material?.name) || "";
        return sortConfig.direction === "asc"
          ? aDesc.localeCompare(bDesc)
          : bDesc.localeCompare(aDesc);
      }
      if (sortConfig.key === "price") {
        const aPrice = a.price || (a.default && a.default.price) || 0;
        const bPrice = b.price || (b.default && b.default.price) || 0;
        return sortConfig.direction === "asc"
          ? aPrice - bPrice
          : bPrice - aPrice;
      }
      return 0;
    });
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
                  editableServices?.length === 0 && fetchEditableServices();
                }}
              >
                Edit Prices
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[80vw] flex flex-col h-full">
              <SheetHeader className="flex-shrink-0">
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
                <SheetDescription>
                  Make changes to product prices below
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-6">
                <div className="rounded-md border h-full">
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
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("material")}
                            className="h-8 p-0 font-medium"
                          >
                            Material
                            {getSortIcon("material")}
                          </Button>

                          <Popover
                            open={isFilterOpen}
                            onOpenChange={setIsFilterOpen}
                          >
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
                              style={{ position: "fixed" }}
                            >
                              <div className="space-y-2">
                                <div className="font-medium">
                                  Filter by Material
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant={
                                      !selectedMaterial ? "default" : "outline"
                                    }
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
                                      variant={
                                        selectedMaterial === material
                                          ? "default"
                                          : "outline"
                                      }
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
                    <TableBody>
                      {(sortConfig.key
                        ? sortData(filteredProducts)
                        : filteredProducts
                      )?.map((product) => {
                        const hasNewPrice =
                          selectedClient !== "default"
                            ? !!getClientPrice(product.id, selectedClient)
                            : !!defaultClientPrices.find(
                                (item) => item.serviceId === product.id
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
                                      (item) => item.serviceId === product.id
                                    )?.price || 0
                                  }
                                  onChange={(e) => {
                                    const newPrice =
                                      parseFloat(e.target.value) || 0;
                                    setDefaultClientPrices((prevPrices) => {
                                      const index = prevPrices.findIndex(
                                        (item) => item.serviceId === product.id
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
                                            serviceId: product.id,
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="flex pb-2 mb-5 border-b gap-4 text-sm relative">
        <button onClick={() => setActiveTab("products")} className="relative">
          Products
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`${
            activeTab === "services" ? "text-primary" : "text-base"
          } relative`}
        >
          Services
          <div className="absolute w-[70px] border border-[#1D4ED8] -bottom-[10px] -right-2"></div>
        </button>
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
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("material")}
                    className="h-8 p-0 font-medium"
                  >
                    Material
                    {getSortIcon("material")}
                  </Button>
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
                // Only show services that have special prices for the selected client
                sortData(editableServices).filter((service) =>
                  getClientPrice(service.id, selectedClient)
                ).map((service) => (
                  <TableRow key={service.id} className="hover:bg-muted/50">
                    {selectedClient !== "default" && (
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(service.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectProduct(service.id, checked)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell>{service.material?.name}</TableCell>
                    {selectedClient !== "default" && (
                      <TableCell
                        className={cn(
                          "font-medium",
                          getClientPrice(service.id, selectedClient) &&
                            "text-green-600 dark:text-green-400"
                        )}
                      >
                        ${getClientPrice(service.id, selectedClient)?.toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell>${service.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {selectedClient !== "default" &&
                        getClientPrice(service.id, selectedClient) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveClientPrice(service.id)
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
                sortData(editableServices).map((product) => (
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

export default ClientServicePricing;
