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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";
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
  const [formData, setFormData] = useState({
    due_date: "",
  });
  const [products, setProducts] = useState<ProductType[]>([]);
  const { user } = useAuth();
  console.log(invoice, "invoice ere");
  useEffect(() => {
    if (invoice) {
      const transformedItems = invoice?.products?.map((item, index) => ({
        unitPrice: (item?.discounted_price?.price ?? 0).toFixed(2),
        discount: invoice?.discounted_price?.[index].discount ?? 0,
        quantity: invoice?.discounted_price?.[index].quantity ?? 0,
        discountId: invoice?.discounted_price?.[index].id ?? 0,
        caseProductTeethId: item.teethProduct.id,
        toothNumber: item.teethProduct?.tooth_number
          .map((item) => item)
          .join(","),
        description: item.name,
        id: item.id,
        due_amount: invoice?.invoice?.[0]?.due_amount,
      }));
      setItems(transformedItems as any);
      setNotes({
        labNotes: "" as string,
        invoiceNotes: invoice.invoice_notes as string,
      });
      setDiscount(invoice.discount?.value || 0);
    }
    setFormData({ due_date: invoice?.invoice?.[0].due_date || "" });
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
      // Convert toothNumber string to an array, handle errors gracefully
      let toothArray: number[] = [];
      try {
        toothArray = item.toothNumber.split(",").map((num) => {
          const parsed = parseInt(num.trim(), 10); // Parse each number
          if (isNaN(parsed)) throw new Error("Invalid tooth number");
          return parsed;
        });
      } catch (error) {
        console.error(
          `Error parsing toothNumber for item: ${item.id}, skipping item.`
        );
        return sum; // Skip this item and continue to the next
      }

      // Calculate the total for this item
      const itemTotal =
        Number(item.unitPrice) * item.quantity * toothArray.length; // Total before discount
      const discountedItemTotal =
        itemTotal - (itemTotal * (item.discount || 0)) / 100; // Apply discount

      return sum + discountedItemTotal; // Add to the running sum
    }, 0);

    // Apply a global discount to the subtotal (if any)
    const totalDiscountAmount = (subtotal * discount) / 100;

    // Return the final total after applying the global discount
    return subtotal - totalDiscountAmount;
  };
  const handleSave = async () => {
    if (!invoice) return;

    try {
      setIsSubmitting(true);

      const updatedInvoice: any = {
        items: items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountId: item.discountId,
          caseProductTeethId: item.caseProductTeethId,
          toothNumber: item.toothNumber,
          total:
            Number(item.unitPrice) *
            item.quantity *
            (1 - (item.discount || 0) / 100),
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
              (sum, item) => sum + Number(item.unitPrice) * item.quantity,
              0
            ) *
            (discount / 100),
        },
        id: invoice.id,
        totalDue: invoice.invoice?.[0].due_amount,
        updatedAt: new Date().toISOString(),
        totalAmount: calculateTotal(),
        oldTotalAmount: invoice.invoice?.[0].amount,
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
                id,
                product_id,
                discount,
                final_price,
                price,
                quantity
              `
        )
        .in("product_id", [product.id])
        .eq("case_id", invoice?.id);

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
                  discountId: data[0].id,
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
                  discountId: "",
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
  function updateInvoice(
    old_amount: number,
    new_amount: number,
    due_amount: number
  ) {
    let paid_amount = old_amount - due_amount;
    let new_due_amount = Math.max(0, new_amount - paid_amount);

    return {
      amount: new_amount,
      due_amount: new_due_amount,
    };
  }

  const handleInvoiceDueDateUpdate = async () => {
    if (!formData.due_date) {
      toast.error("Due Date is Missing!!");
      return;
    }

    const { data, error: updateError } = await supabase
      .from("invoices")
      .update({ due_date: formData.due_date })
      .eq("case_id", invoice?.id)
      .select("*");
    console.log(data, "data updated", updateError);
    if (updateError) {
      toast.error(`Failed to update invoice with ID`);
    }

    // onClose();
  };
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="min-w-[800px] w-[90vw] max-w-[1200px] max-h-[85vh] overflow-y-auto"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            Edit Invoice #
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
              ? "Edit invoice Due Date."
              : "Record payment details for this invoice."}
          </div>
        </DialogHeader>

        <div>
          <div className="space-y-0 h-[24rem]">
            <Label htmlFor="due_date" className="text-xs">
              Received Date *
            </Label>
            <DatePicker
              date={formData.due_date ? new Date(formData.due_date) : undefined}
              onSelect={(date) =>
                setFormData({ due_date: date?.toISOString() as string })
              }
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date()}
              dateFormat="MM/dd/yyyy"
              placeholder="Select order date"
              updatedDate={
                formData.due_date ? new Date(formData.due_date) : new Date()
              }
            />
          </div>
        </div>
        {/* <div className="space-y-6" id="dialog-onhold">
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

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                disabled={invoice?.invoice?.[0]?.status === "paid"}
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
                    <TableRow key={index}>
                      <TableCell>
                        {
                          <Input
                            value={item.toothNumber || ""}
                            disabled={invoice?.invoice?.[0]?.status === "paid"}
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
                        <div className="">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={
                                invoice?.invoice?.[0]?.status === "paid"
                              }
                              className="flex justify-between items-center p-2 border w-full gap-2 hover:text-gray-600 focus:outline-none"
                            >
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
                                    {products.map((c, i) => (
                                      <div
                                        key={i}
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
                          className="w-24"
                          disabled={invoice?.invoice?.[0]?.status === "paid"}
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = {
                              ...item,
                              unitPrice: Number(e.target.value).toFixed(2),
                            };
                            setItems(updatedItems);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          disabled={invoice?.invoice?.[0]?.status === "paid"}
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
                          disabled={invoice?.invoice?.[0]?.status === "paid"}
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
                          Number(item.unitPrice) *
                            item.quantity *
                            (1 - (item.discount || 0) / 100) *
                            (item.toothNumber
                              .split(",")
                              .filter((num) => num.trim() !== "").length || 0)
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setItems((prevItems) =>
                              prevItems.filter((_, i) => i !== index)
                            );
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

          <div className="flex gap-5 flex-col md:flex-row justify-between items-start">
            <div className="w-1/2">
              <h3 className="text-lg font-medium mb-2">Invoice Notes</h3>
              <textarea
                value={notes?.invoiceNotes}
                disabled={invoice?.invoice?.[0]?.status === "paid"}
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

            <div className="w-1/2 space-y-4 h-[150px] flex justify-end items-end gap-5">
              <div className="flex border-t-2 border-b-2 py-5 font-bold">
                <span>Paid Amount:</span>
                <span>
                  $
                  {Number(invoice?.invoice?.[0]?.amount) -
                    Number(invoice?.invoice?.[0].due_amount)}
                </span>
              </div>
              <div className="flex border-t-2 border-b-2 py-5 font-bold ">
                <span>Due Amount:</span>
                <span>
                  {
                    updateInvoice(
                      Number(invoice?.invoice?.[0]?.amount),
                      calculateTotal(),
                      Number(invoice?.invoice?.[0].due_amount)
                    ).due_amount
                  }{" "}
                </span>
              </div>
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
        </div> */}

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isSubmitting || invoice?.invoice?.[0]?.status === "paid"}
            onClick={() => handleInvoiceDueDateUpdate()}
          >
            {isSubmitting ? "Saving..." : "Complete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
