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

type Product = Database["public"]["Tables"]["products"]["Row"];
type Material = Database["public"]["Tables"]["materials"]["Row"];
type BillingType = Database["public"]["Tables"]["billing_types"]["Row"];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  description: z.string().optional(),
  lead_time: z.coerce.number().optional(),
  is_client_visible: z.boolean().default(true),
  is_taxable: z.boolean().default(true),
  material_id: z.string().min(1, "Material is required"),
  billing_type_id: z.string().min(1, "Billing type is required"),
  requires_shade: z.boolean().default(false),
});

interface EditProductFormProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: z.infer<typeof productSchema>) => Promise<void>;
}

export function EditProductForm({
  product,
  isOpen,
  onClose,
  onSave,
}: EditProductFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [materialsData, billingTypesData] = await Promise.all([
          supabase.from("materials").select("*").order("name"),
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
  }, []);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      material_id: "",
      billing_type_id: "",
      price: 0,
      lead_time: 0,
      is_client_visible: true,
      is_taxable: true,
      requires_shade: false,
    },
    values: {
      name: product?.name || "",
      description: product?.description || "",
      material_id: product?.material_id || "",
      billing_type_id: product?.billing_type_id || "",
      price: product?.price || 0,
      lead_time: product?.lead_time || 0,
      is_client_visible: product?.is_client_visible ?? true,
      is_taxable: product?.is_taxable ?? true,
      requires_shade: product?.requires_shade ?? false,
    },
  });

  async function onSubmit(values: z.infer<typeof productSchema>) {
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      toast.error("Failed to save product");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "New Product"}</DialogTitle>
          <DialogDescription>
            Make changes to the product details here.
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
                        <Input placeholder="Product name" {...field} />
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
                        <Input placeholder="Product description" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {billingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label || type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lead_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Time (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
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
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Visible to Clients</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_taxable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Taxable</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_shade"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Requires Shade</FormLabel>
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
