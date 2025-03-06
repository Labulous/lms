import React, { useState, useRef, useEffect, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { ServiceInput } from "@/services/productsService";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getLabIdByUserId } from "@/services/authService";

type Material = Database["public"]["Tables"]["materials"]["Row"];

interface BatchServiceUploadProps {
  onUpload: (services: ServiceInput[]) => Promise<void>;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
  isOpen: boolean;
}

const emptyService = (): ServiceInput => ({
  name: "",
  price: 0,
  is_client_visible: true,
  is_taxable: true,
  material_id: "",
  description: "",
  lab_id: "",
  product_code: "",
});

const BatchServiceUpload: React.FC<BatchServiceUploadProps> = ({
  onUpload,
  setIsOpen,
  isOpen,
}) => {
  const [services, setServices] = useState<ServiceInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [labId, setLabId] = useState<string>("");

  // Reference data
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    const fetchLabId = async () => {
      if (user?.id) {
        const data = await getLabIdByUserId(user.id);
        if (data?.labId) {
          setLabId(data.labId);
          setServices([{ ...emptyService(), lab_id: data.labId }]);
        }
      }
    };
    fetchLabId();
  }, [user]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from("materials")
          .select("*")
          .order("name");
        if (error) {
          console.error("Error fetching materials:", error);
          toast.error("Failed to load materials");
          return;
        }
        setMaterials(data || []);
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Failed to load materials");
      }
    };
    fetchMaterials();
  }, []);

  const addService = () => {
    if (!labId) {
      toast.error("Lab ID not available. Please try again.");
      return;
    }
    setServices([...services, { ...emptyService(), lab_id: labId }]);
  };

  const removeRow = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (
    index: number,
    field: keyof ServiceInput,
    value: any
  ) => {
    const updatedServices = [...services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };
    setServices(updatedServices);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0]
          .toLowerCase()
          .split(",")
          .map((h) => h.trim());

        const newServices: ServiceInput[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const service: Partial<ServiceInput> = {};

          headers.forEach((header, index) => {
            const value = values[index];
            switch (header) {
              case "name":
                service.name = value;
                break;
              case "price":
                service.price = parseFloat(value) || 0;
                break;
              case "visible to clients":
                service.is_client_visible = value.toLowerCase() === "true";
                break;
              case "taxable":
                service.is_taxable = value.toLowerCase() === "true";
                break;
              case "material id":
                service.material_id = value.trim();
                break;
              case "description":
                service.description = value.trim();
                break;
            }
          });

          // Validate required fields
          if (!service.name) {
            errors.push(`Row ${i}: Name is required`);
            continue;
          }
          if (!service.material_id) {
            errors.push(`Row ${i}: Material ID is required`);
            continue;
          }

          newServices.push(service as ServiceInput);
        }

        if (errors.length > 0) {
          toast.error(
            <div>
              <p>Errors in CSV file:</p>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          );
          return;
        }

        setServices(
          newServices.map((service) => ({ ...service, lab_id: labId }))
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast.success(`Successfully parsed ${newServices.length} services`);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error(
          "Error parsing CSV file. Please check the format and try again."
        );
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = [
      "Name",
      "Price",
      "Visible to Clients",
      "Taxable",
      "Material ID",
      "Description",
    ].join(",");

    const sample = [
      "Sample Service",
      "99.99",
      "true",
      "true",
      "material_id_here",
      "Sample description",
    ].join(",");

    const csvContent = `${headers}\n${sample}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "service_template.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const validateServices = (servicesToValidate: ServiceInput[]): string[] => {
    const errors: string[] = [];

    servicesToValidate.forEach((service, index) => {
      if (!service.name?.trim()) {
        errors.push(`Row ${index + 1}: Name is required`);
      }
      if (!service.material_id?.trim()) {
        errors.push(`Row ${index + 1}: Material is required`);
      }
      if (typeof service.price !== "number") {
        errors.push(`Row ${index + 1}: Price must be a number`);
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    try {
      if (!labId) {
        toast.error("Lab ID not available. Please try again.");
        return;
      }

      // Validate services before submitting
      const invalidServices = services.filter(
        (service) => !service.name || !service.material_id || service.price < 0
      );

      if (invalidServices.length > 0) {
        toast.error(
          "Please fill in all required fields (Name, Material, Price) for all services."
        );
        return;
      }

      setIsSubmitting(true);

      // Ensure all services have lab_id
      // const servicesWithLabId = services.map((service) => ({
      //   ...service,
      //   lab_id: labId,
      // }));

      // Map services and generate product_code dynamically
      const { data: servicesData, error } = await supabase
        .from("services")
        .select("*")
        .eq("lab_id", labId)
      if (error) {
        console.error("Error fetching services:", error);
        return;
      }

      const servicesWithLabId = services.map((service) => {
        const selectedMaterial = materials.find(mat => mat.id === service.material_id);
        if (!selectedMaterial) {
          return {
            ...service,
            lab_id: labId,
            product_code: "",
          };
        }
        const existingServices = servicesData.filter(s => s.material_id === service.material_id);
        const highestServiceCode = existingServices.length > 0
          ? Math.max(...existingServices.map(s => Number(s?.product_code) || 0))
          : 0;
        const newServiceCode = highestServiceCode > 0
          ? (Number(highestServiceCode) + 1).toString()
          : (Number(selectedMaterial.code) + 1).toString();

        return {
          ...service,
          lab_id: labId,
          product_code: newServiceCode,
        };
      });

      await onUpload(servicesWithLabId);
      console.log(servicesWithLabId, "servicesWithLabId");
      setIsOpen(false);
      // setServices([{ ...emptyService(), lab_id: labId }]);
      // setActiveTab("manual");
    } catch (error: any) {
      console.error("Error uploading services:", error);
      toast.error(
        error?.message || "Failed to add services. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          // Reset state when closing
          setServices([{ ...emptyService(), lab_id: labId }]);
          setActiveTab("manual");
          setIsOpen(false);
        } else {
          setIsOpen(open);
        }
      }}
    >
      <DialogContent
        className="max-w-[1440px] max-h-[80vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Services</DialogTitle>
          <DialogDescription>
            Add services manually or upload a CSV file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[600px]">Name</TableHead>
                      <TableHead className="w-[180px]">Price</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="w-[300px]">Description</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={service.name}
                            onChange={(e) =>
                              updateService(index, "name", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) =>
                              updateService(
                                index,
                                "price",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={service.material_id}
                            onValueChange={(value) =>
                              updateService(index, "material_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem
                                  key={material.id}
                                  value={material.id}
                                >
                                  {material.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={service.description}
                            onChange={(e) =>
                              updateService(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`visible-${index}`}
                                checked={service.is_client_visible}
                                onCheckedChange={(checked) =>
                                  updateService(
                                    index,
                                    "is_client_visible",
                                    checked
                                  )
                                }
                              />
                              <Label htmlFor={`visible-${index}`}>
                                Visible
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`taxable-${index}`}
                                checked={service.is_taxable}
                                onCheckedChange={(checked) =>
                                  updateService(index, "is_taxable", checked)
                                }
                              />
                              <Label htmlFor={`taxable-${index}`}>
                                Taxable
                              </Label>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={addService}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchServiceUpload;
