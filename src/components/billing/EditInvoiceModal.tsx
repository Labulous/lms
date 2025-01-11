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
import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { productsService } from "@/services/productsService";
import { supabase } from "@/lib/supabase";
import { ProductType } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  mode?: "edit" | "payment";
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

export interface LineItem extends InvoiceItem {
  category?: string;
}

export function EditInvoiceModal({
  invoice,
  mode = "edit",
  onClose,
  onSave,
}: EditInvoiceModalProps) {
  // const navigate = useNavigate();
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState<{
    labNotes: string;
    invoiceNotes: string;
  } | null>();
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductType[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    if (invoice) {
      const transformedItems = (invoice?.products ?? []).map((item) => ({
        unitPrice: item?.discounted_price?.price ?? 0,
        discount: item?.discounted_price?.discount ?? 0,
        quantity: item?.discounted_price?.quantity ?? 0,
        toothNumber: item.teethProducts?.tooth_number?.join(",") || "1",
        description: item.name,
        id: item.id,
      }));
      setItems(transformedItems);
      setNotes({
        labNotes: invoice.lab_notes as string,
        invoiceNotes: invoice.invoice_notes as string,
      });
      setDiscount(invoice.discount?.value || 0);
    }
  }, [invoice]);
  useEffect(() => {
    const fetchProducts = async () => {
      const lab = await getLabIdByUserId(user?.id as string);

      if (!lab?.labId) {
        console.error("Lab ID not found.");
        return;
      }

      try {
        const fetchedProducts = await productsService.getProducts(lab.labId);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        console.log("");
      }
    };

    fetchProducts();
  }, []);

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
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          toothNumber: item.toothNumber,
          total:
            item.unitPrice * item.quantity * (1 - (item.discount || 0) / 100),
        })),
        notes: notes as {
          labNotes: string;
          invoiceNotes: string;
        },
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
        id: invoice.id,
        updatedAt: new Date().toISOString(),
        totalAmount: calculateTotal(),
      };

      await onSave(updatedInvoice);
      toast.success("Invoice updated successfully");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };
  const clients = [{ id: "1", clientName: "zahid" }];

  const handleSelectedProduct = async (product: any) => {
    try {
      // Fetch discounted_price from Supabase
      const { data, error } = await supabase
        .from("discounted_price")
        .select(
          `
                product_id,
                discount,
                final_price,
                price,
                quantity
              `
        )
        .in("product_id", [product.id]);

      if (error) {
        console.error("Error fetching discounted price:", error.message);
        return;
      }
      if (data.length > 0) {
        setItems((items) =>
          items.map((item) =>
            item.id === ""
              ? {
                  ...item,
                  discount: data[0].discount,
                  unitPrice: data[0].price,
                  id: data[0].product_id,
                  description: product.name,
                  quantity: data[0]?.quantity ?? 1,
                }
              : item
          )
        );
      } else {
        console.warn("No discounted price found for this product.");
        setItems((items) =>
          items.map((item) =>
            item.id === ""
              ? {
                  ...item,
                  discount: 0,
                  unitPrice: 0,
                  id: product.id,
                  description: product.name,
                  quantity: 1,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err);
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
            {(() => {
              if (invoice?.case_number) {
                const parts = invoice.case_number.split("-");
                parts[0] = "INV";
                return parts.join("-");
              }
              return "";
            })()}
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
                  const hasNullId = items.some((item) => item.id === "");

                  if (hasNullId) {
                    toast.error("Please select the item first.");
                  } else {
                    const newItem: LineItem = {
                      id: "",
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      discount: 0,
                      category: "tooth",
                      toothNumber: "",
                    };
                    setItems([...items, newItem]);
                  }
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
                      <TableCell className="">
                        {/* change this to dropdown */}
                        {/* <Input
                          value={item.description}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              description: e.target.value,
                            };
                            setItems(updatedItems);
                          }}
                        /> */}
                        <div className="">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex justify-between items-center p-2 border w-full gap-2 hover:text-gray-600 focus:outline-none">
                              <h2 className="text-gray-900">
                                {item.description ?? "select the product"}
                              </h2>
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="start"
                              className="bg-white border"
                              style={{ width: "w-full", minWidth: "100%" }} // Ensure it takes 100% width, but can grow based on content
                            >
                              <div className="w-full overflow-y-scroll max-h-[400px]">
                                {clients.length === 0 ? (
                                  <DropdownMenuItem disabled>
                                    No clients found
                                  </DropdownMenuItem>
                                ) : (
                                  <div className="">
                                    {products.map((c) => (
                                      <div
                                        key={c.id}
                                        onClick={() =>
                                          // navigate(`/clients/${c.id}`)
                                          handleSelectedProduct(c)
                                        }
                                        className="cursor-pointer w-full hover:bg-gray-200"
                                      >
                                        {c.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
          <div className="flex gap-5 flex-col md:flex-row justify-between items-start">
            <div className="w-1/2">
              <h3 className="text-lg font-medium mb-2">Invoice Notes</h3>
              <textarea
                value={notes?.invoiceNotes}
                onChange={(e) =>
                  setNotes(
                    (prevNotes) =>
                      ({
                        ...prevNotes,
                        invoiceNotes: e.target.value,
                      } as {
                        labNotes: string;
                        invoiceNotes: string;
                      })
                  )
                }
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>
            <div className="w-1/2">
              <h3 className="text-lg font-medium mb-2">Lab Notes</h3>
              <textarea
                value={notes?.labNotes}
                onChange={(e) =>
                  setNotes(
                    (prevNotes) =>
                      ({
                        ...prevNotes,
                        labNotes: e.target.value,
                      } as {
                        labNotes: string;
                        invoiceNotes: string;
                      })
                  )
                }
                className="w-full h-32 p-2 border rounded-md"
              />
            </div>

            <div className="w-1/3 space-y-4 h-[150px] flex justify-end items-end">
              <div className="flex border-t-2 border-b-2 py-5 font-bold">
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
