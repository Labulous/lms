import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Material = Database["public"]["Tables"]["materials"]["Row"];
type BillingType = Database["public"]["Tables"]["billing_types"]["Row"];

const serviceSchema = z.object({
  name: z.string(),
  price: z.coerce.number(),
  description: z.string().optional(),
  is_client_visible: z.boolean(),
  is_taxable: z.boolean(),
  material_id: z.string(),
  billing_type_id: z.string(),
});


interface EditServiceFormProps {
  service?: {
    id: string;
    name: string;
    description: string;
    price: number;
    is_client_visible: boolean;
    is_taxable: boolean;
    material_id?: string;  // Make it optional
    lab_id: string;
    created_at: string;
    updated_at: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: z.infer<typeof serviceSchema>) => void;
}

export function EditServiceForm({
  service,
  isOpen,
  onClose,
  onSave,
}: EditServiceFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!service?.lab_id) return; // Ensure lab_id exists before fetching
  
      try {
        const [materialsData, billingTypesData] = await Promise.all([
          supabase
            .from("materials")
            .select("*")
            .eq("lab_id", service.lab_id) // Filter by lab_id
            .order("name"),
          supabase.from("billing_types").select("*").order("name"),
        ]);
  
        if (materialsData.error || billingTypesData.error) {
          toast.error("Failed to fetch reference data");
        }
  
        setMaterials(materialsData.data || []);
        setBillingTypes(billingTypesData.data || []);
      } catch (error) {
        toast.error("Error fetching data");
      }
    };
  
    fetchReferenceData();
  }, [service?.lab_id]); // Runs when service.lab_id changes

  


  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      material_id: "",
      billing_type_id: "",
      price: 0,
      is_client_visible: true,
      is_taxable: true,
    },
    mode: "onChange", // Optional: Ensures validation runs on change
  });

  const { setValue, watch } = form;
  const formData = watch(); // Watches form values in real time

  // Function to handle onChange and update form state
  const handleChange =
    (field: keyof typeof formData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value =
          event.target.type === "checkbox"
            ? (event.target as HTMLInputElement).checked
            : event.target.value;

        setValue(field, value, { shouldValidate: true, shouldDirty: true });
      };



      useEffect(() => {
        if (service) {
          form.reset({
            name: service.name ?? "",
            description: service.description ?? "",
            material_id: service.material_id ?? "",
            billing_type_id: "",
            price: service.price ?? 0,
            is_client_visible: service.is_client_visible ?? true,
            is_taxable: service.is_taxable ?? true,
          }, { keepDirtyValues: true }); // Keeps user-modified values
        }
      }, [service]); // No need to add form.reset in dependencies
      

  async function onSubmit(values: z.infer<typeof serviceSchema>) {
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      toast.error("Failed to save service");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "New Service"}</DialogTitle>
          <DialogDescription>
            Make changes to the service details here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Service Name"
                          {...field}
                          value={field.value} // Ensure input reflects the value
                          onChange={(e) => {
                            field.onChange(e); // React Hook Form handles this
                            handleChange("name")(e); // Additional update logic
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Service description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="material_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="is_client_visible"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange as (value: boolean) => void} />
                    </FormControl>
                    <FormLabel>Visible to Clients</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_taxable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange as (value: boolean) => void} />
                    </FormControl>
                    <FormLabel>Taxable</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
