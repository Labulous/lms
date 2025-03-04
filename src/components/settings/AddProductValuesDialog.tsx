import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { productsService } from "@/services/productsService";
import { toast } from "react-hot-toast";

interface AddProductValuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "product_types" | "materials";
  labId: string;
  reCall?: () => void;
}

export function AddProductValuesDialog({
  open,
  onOpenChange,
  type,
  labId,
  reCall,
}: AddProductValuesDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Code is required");
      return;
    }



    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!labId) {
      toast.error("Lab ID is required");
      return;
    }

    setIsLoading(true);
    try {
      if (type === "product_types") {
        await productsService.createProductType({
          name,
          description: description || null,
          lab_id: labId,
        });
      } else {

      const existingMaterials = await productsService.getMaterials(labId);
      const isDuplicate = existingMaterials.some(
        (material: any) => material.code === code.trim()
      );

      if (isDuplicate) {
        toast.error("Code already exists. Please use a unique code.");
        setIsLoading(false);
        return;
      }


        await productsService.createMaterial({
          code,
          name,
          description: description || null,
          lab_id: labId,
        });
      }
      toast.success(
        `${type === "product_types" ? "Product type" : "Material"
        } created successfully`
      );
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating value:", error);
      toast.error(
        error.message ||
        `Failed to create ${type === "product_types" ? "product type" : "material"
        }`
      );
    } finally {
      setIsLoading(false);
      reCall && reCall();
    }
  };

  useEffect(() => {
    const fetchLastCode = async () => {
      try {
        const materials = await productsService.getMaterials(labId);
        if (materials.length > 0) {
          const lastCode = Math.max(...materials.map(m => parseInt(m.code, 10)));
          setCode((lastCode + 1).toString().padStart(4, "0"));
        } else {
          setCode("0001");
        }
      } catch (error) {
        console.error("Error fetching last code:", error);
      }
    };  
    fetchLastCode();
  }, []); 

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add {type === "product_types" ? "Product Type" : "Material"}
          </DialogTitle>
          <DialogDescription>
            Add a new {type === "product_types" ? "product type" : "material"}{" "}
            to your catalog.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Code
            </label>
            <Input
              id="code"
              type="number"
              value={code}
              onChange={(e) => {
                const newValue = e.target.value.replace(/\D/, "");
                if (newValue.length <= 4) {
                  setCode(newValue);
                }
              }}
              placeholder="Enter 4-digit number"
              disabled={true}
            />

          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
