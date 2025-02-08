import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { productsService } from "@/services/productsService";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "react-hot-toast";

interface Value {
  id: string;
  name: string;
  description: string | null;
}

interface EditProductValuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  type: "product_types" | "materials";
  labId: string;
  reCall?: () => void;
}

export default function EditProductValuesDialog({
  open,
  onOpenChange,
  title,
  type,
  labId,
  reCall,
}: EditProductValuesDialogProps) {
  const [values, setValues] = useState<Value[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Value>({
    id: "",
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadValues = async () => {
    if (!labId) {
      toast.error("Lab ID is required");
      return;
    }

    setIsLoading(true);
    try {
      let data;
      if (type === "product_types") {
        data = await productsService.getProductTypes(labId);
      } else {
        data = await productsService.getMaterials(labId);
      }
      setValues(data);
    } catch (error: any) {
      console.error("Error loading values:", error);
      toast.error(error.message || "Failed to load values");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && labId) {
      loadValues();
    }
  }, [open, labId, type]);

  const handleStartEdit = (value: Value) => {
    setEditingId(value.id);
    setEditForm({
      id: value.id,
      name: value.name,
      description: value.description,
    });
  };

  const handleEdit = async (updatedValue: Value) => {
    if (!updatedValue.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      if (type === "product_types") {
        await productsService.updateProductType(updatedValue.id, {
          name: updatedValue.name.trim(),
          description: updatedValue.description?.trim() || null,
        });
      } else {
        console.log(updatedValue, "updatedValue");
        await productsService.updateMaterial(updatedValue.id, {
          name: updatedValue.name.trim(),
          description: updatedValue.description?.trim() || null,
        });
      }
      toast.success(`${title} updated successfully`);
      setEditingId(null);
      loadValues();
    } catch (error: any) {
      console.error("Error updating value:", error);
      toast.error(error.message || `Failed to update ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
      reCall && reCall();
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      if (type === "product_types") {
        await productsService.deleteProductType(id);
      } else {
        await productsService.deleteMaterial(id);
      }
      toast.success(`${title} deleted successfully`);
      loadValues();
    } catch (error: any) {
      console.error("Error deleting value:", error);
      toast.error(error.message || `Failed to delete ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
      reCall && reCall();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ id: "", name: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
          <DialogDescription>
            View and edit existing {title.toLowerCase()}. Click the pencil icon
            to modify or the trash icon to delete.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : values.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No items found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {values.map((value) => (
                  <TableRow key={value.id}>
                    <TableCell>
                      {editingId === value.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          disabled={isLoading}
                        />
                      ) : (
                        value.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === value.id ? (
                        <Textarea
                          value={editForm.description || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          disabled={isLoading}
                        />
                      ) : (
                        value.description
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === value.id ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(editForm)}
                            disabled={isLoading}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(value)}
                            disabled={isLoading}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(value.id)}
                            disabled={isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
