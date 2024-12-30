import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Invoice, InvoiceItem } from "@/data/mockInvoicesData";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  mode?: "edit" | "payment";
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

interface LineItem extends InvoiceItem {
  category: "tooth" | "alloy";
  toothNumber?: string;
}

export function EditInvoiceModal({
  invoice,
  mode = "edit",
  onClose,
  onSave,
}: EditInvoiceModalProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      const transformedItems = invoice.products.map((item) => ({
        unitPrice: item.discounted_price.price,
        discount: item.discounted_price.discount,
        quantity: 1,
        toothNumber: item.teethProducts[0]?.tooth_number?.join(",") || null,
        description:item.name
      }));
      setItems(transformedItems);
      setNotes(invoice.notes || "");
      setDiscount(invoice.discount?.value || 0);
    }
  }, [invoice]);
  console.log(items, "items");
  const calculateSubtotal = (category: "tooth" | "alloy") => {
    return items
      .filter((item) => item.category === category)
      .reduce((sum, item) => {
        const itemTotal = item.unitPrice * item.quantity;
        const discountAmount = (itemTotal * (item.discount || 0)) / 100;
        return sum + (itemTotal - discountAmount);
      }, 0);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      const discountAmount = (itemTotal * (item.discount || 0)) / 100;
      return sum + (itemTotal - discountAmount);
    }, 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setIsSubmitting(true);

      const updatedInvoice: Invoice = {
        ...invoice,
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total:
            item.unitPrice * item.quantity * (1 - (item.discount || 0) / 100),
          caseId: item.category === "tooth" ? invoice.case.id : undefined,
        })),
        notes: notes,
        discount: {
          type: "percentage",
          value: discount,
          amount:
            items.reduce(
              (sum, item) => sum + item.unitPrice * item.quantity,
              0
            ) *
            (discount / 100),
        },
        updatedAt: new Date().toISOString(),
      };

      await onSave(updatedInvoice);
      toast.success("Invoice updated successfully");
      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="min-w-[800px] w-[90vw] max-w-[1200px] max-h-[85vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit" : "Record Payment"} - Invoice #
            {invoice?.id}
          </DialogTitle>
          <div id="dialog-description" className="text-sm text-gray-500">
            {mode === "edit"
              ? "Edit invoice details including items, prices, and discounts."
              : "Record payment details for this invoice."}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{invoice?.clientName}</h3>
              <p className="text-sm text-gray-500">
                Case #{invoice?.case_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Date:{" "}
                {new Date(invoice?.received_date || "").toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Due: {new Date(invoice?.due_date || "").toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newItem: LineItem = {
                    id: crypto.randomUUID(),
                    description: "",
                    quantity: 1,
                    unitPrice: 0,
                    discount: 0,
                    total: 0,
                    category: "tooth",
                  };
                  setItems([...items, newItem]);
                }}
              >
                Add Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tooth #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[100px]">Unit Price</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[100px]">Discount %</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Amount
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {
                          <Input
                            value={item.toothNumber || ""}
                            onChange={(e) => {
                              const updatedItems = [...items];
                              updatedItems[index] = {
                                ...item,
                                toothNumber: e.target.value,
                              };
                              setItems(updatedItems);
                            }}
                            className="w-20"
                          />
                        }
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              description: e.target.value,
                            };
                            setItems(updatedItems);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              unitPrice: parseFloat(e.target.value),
                            };
                            setItems(updatedItems);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              quantity: parseInt(e.target.value),
                            };
                            setItems(updatedItems);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              discount: parseFloat(e.target.value),
                            };
                            setItems(updatedItems);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(
                          item.unitPrice *
                            item.quantity *
                            (1 - (item.discount || 0) / 100)
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setItems(items.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals and Notes */}
          <div className="flex justify-between items-start">
            <div className="w-1/2">
              <h3 className="text-lg font-medium mb-2">Invoice Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>

            <div className="w-1/3 space-y-4">
              <div className="flex justify-between">
                <span>Subtotal (Tooth Items):</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(calculateSubtotal("tooth"))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal (Alloy Items):</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(calculateSubtotal("alloy"))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Invoice Discount (%):</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/cases/${invoice?.case.id}`)}
          >
            Case Notes
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? "Saving..." : "Complete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
