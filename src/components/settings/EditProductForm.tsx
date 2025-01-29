import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  material: { name: string } | null;
  product_type: { name: string } | null;
  billing_type: { name: string; label: string | null } | null;
};

type Material = Database["public"]["Tables"]["materials"]["Row"];
type ProductType = Database["public"]["Tables"]["product_types"]["Row"];
type BillingType = Database["public"]["Tables"]["billing_types"]["Row"];

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  description: z.string().optional(),
  lead_time: z.coerce.number().optional(),
  is_client_visible: z.boolean().default(true),
  is_taxable: z.boolean().default(true),
  material_id: z.string().min(1, "Material is required"),
  product_type_id: z.string().optional(),
  billing_type_id: z.string().min(1, "Billing type is required"),
  requires_shade: z.boolean().default(false),
});

interface EditProductFormProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: z.infer<typeof formSchema>) => void;
}

export function EditProductForm({ product, isOpen, onClose, onSave }: EditProductFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingType[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      lead_time: undefined,
      is_client_visible: true,
      is_taxable: true,
      material_id: "",
      product_type_id: "",
      billing_type_id: "",
      requires_shade: false,
    }
  });

  // Reset form with product data when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        description: product.description || "",
        lead_time: product.lead_time || undefined,
        is_client_visible: product.is_client_visible,
        is_taxable: product.is_taxable,
        material_id: product.material_id || "",
        product_type_id: product.product_type_id || "",
        billing_type_id: product.billing_type_id || "",
        requires_shade: product.requires_shade || false,
      });
    } else {
      form.reset({
        name: "",
        price: 0,
        description: "",
        lead_time: undefined,
        is_client_visible: true,
        is_taxable: true,
        material_id: "",
        product_type_id: "",
        billing_type_id: "",
        requires_shade: false,
      });
    }
  }, [product, form]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [materialsData, productTypesData, billingTypesData] = await Promise.all([
          supabase.from("materials").select("*").order("name"),
          supabase.from("product_types").select("*").order("name"),
          supabase.from("billing_types").select("*").order("name"),
        ]);

        if (materialsData.data) setMaterials(materialsData.data);
        if (productTypesData.data) setProductTypes(productTypesData.data);
        if (billingTypesData.data) setBillingTypes(billingTypesData.data);
      } catch (error) {
        toast.error("Failed to load reference data");
      }
    };

    if (isOpen) {
      fetchReferenceData();
    }
  }, [isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_time"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Lead Time (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="material_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="product_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
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
                name="billing_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="is_client_visible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Visible to Clients</FormLabel>
                      <FormDescription>
                        Show this product to clients in the portal
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_taxable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Taxable</FormLabel>
                      <FormDescription>
                        Apply tax to this product
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_shade"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Shade</FormLabel>
                      <FormDescription>
                        Product requires shade selection
                      </FormDescription>
                    </div>
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
