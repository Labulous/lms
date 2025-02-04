import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tax, getTaxes, createTax, updateTax, deleteTax } from "@/services/taxService";
import TaxDialog from "./TaxDialog";
import { toast } from "react-hot-toast";

interface TaxConfigurationProps {
  labId: string;
}

const TaxConfiguration: React.FC<TaxConfigurationProps> = ({ labId }) => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    if (labId) {
      fetchTaxes();
    }
  }, [labId]);

  const fetchTaxes = async () => {
    try {
      const data = await getTaxes(labId);
      setTaxes(data);
    } catch (error) {
      toast.error("Failed to fetch taxes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTax = async (values: Omit<Tax, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createTax(labId, values);
      fetchTaxes();
      setDialogOpen(false);
      toast.success("Tax created successfully");
    } catch (error) {
      toast.error("Failed to create tax");
    }
  };

  const handleUpdateTax = async (values: Omit<Tax, "id" | "createdAt" | "updatedAt">) => {
    if (!selectedTax) return;
    try {
      await updateTax(labId, selectedTax.id, values);
      fetchTaxes();
      setDialogOpen(false);
      setSelectedTax(null);
      toast.success("Tax updated successfully");
    } catch (error) {
      toast.error("Failed to update tax");
    }
  };

  const handleDeleteTax = async (id: string) => {
    try {
      await deleteTax(labId, id);
      fetchTaxes();
      toast.success("Tax deleted successfully");
    } catch (error) {
      toast.error("Failed to delete tax");
    }
  };

  const handleToggleStatus = async (tax: Tax) => {
    try {
      await updateTax(labId, tax.id, { isActive: !tax.isActive });
      fetchTaxes();
      toast.success("Tax status updated successfully");
    } catch (error) {
      toast.error("Failed to update tax status");
    }
  };

  const openCreateDialog = () => {
    setMode("create");
    setSelectedTax(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tax: Tax) => {
    setMode("edit");
    setSelectedTax(tax);
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Tax Configuration</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tax
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell>{tax.name}</TableCell>
                <TableCell>{tax.description}</TableCell>
                <TableCell>{tax.rate}%</TableCell>
                <TableCell>
                  <Badge variant={tax.isActive ? "success" : "secondary"}>
                    {tax.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(tax)}>
                        {tax.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(tax)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteTax(tax.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TaxDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={mode === "create" ? handleCreateTax : handleUpdateTax}
        initialValues={selectedTax || undefined}
        mode={mode}
      />
    </div>
  );
};

export default TaxConfiguration;
