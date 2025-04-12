import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { BalanceTrackingItem } from "@/types/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { InvoiceTemplate } from "../cases/print/PrintTemplates";

const BalanceList = () => {
  // State
  const [balanceType, setBalanceType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [balaceList, setBalanceList] = useState<BalanceTrackingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClientInvoices, setSelectedClientInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isCaseDrawerOpen, setIsCaseDrawerOpen] = useState(false);

  const { user } = useAuth();
  const filteredBalances: BalanceTrackingItem[] = balaceList.filter(
    (balance) => {
      const matchesSearch = balance.client_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        balanceType === "all" ||
        (balanceType === "outstanding" && balance.outstanding_balance > 0) ||
        (balanceType === "credit" && balance.credit > 0);
      return matchesSearch && matchesType;
    }
  );

  // Calculate totals
  const totals = filteredBalances.reduce(
    (acc, balance) => ({
      outstandingBalance: acc.outstandingBalance + balance.outstanding_balance,
      creditBalance:
        acc.creditBalance +
        (typeof balance?.credit === "number" ? balance.credit : 0),
      thisMonth: acc.thisMonth + balance.this_month,
      lastMonth: acc.lastMonth + balance.last_month,
      days30Plus: acc.days30Plus + balance.days_30_plus,
      days60Plus: acc.days60Plus + balance.days_60_plus,
      days90Plus: acc.days90Plus + balance.days_90_plus,
    }),
    {
      outstandingBalance: 0,
      creditBalance: 0,
      thisMonth: 0,
      lastMonth: 0,
      days30Plus: 0,
      days60Plus: 0,
      days90Plus: 0,
    }
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Function to fetch client invoices
  // const fetchClientInvoices = async (clientId: string, clientName: string) => {
  //   try {
  //     const { data: invoices, error } = await supabase
  //       .from("invoices")
  //       .select("*, cases(case_number)")
  //       .eq("client_id", clientId)
  //       .in("status", ["unpaid", "partially_paid"]);

  //     if (error) {
  //       console.error("Error fetching invoices:", error);
  //       return;
  //     }

  //     // Transform the data to ensure numeric values
  //     const transformedInvoices = invoices?.map(invoice => ({
  //       ...invoice,
  //       total_amount: Number(invoice.total_amount || 0),
  //       amount_paid: Number(invoice.amount_paid || 0),
  //       due_amount: Number(invoice.due_amount || 0),
  //       status: invoice.status,
  //       case_number: invoice.cases?.case_number || ""
  //     }));

  //     setSelectedClientInvoices(transformedInvoices || []);
  //     setSelectedClientName(clientName);
  //     setDrawerOpen(true);
  //   } catch (err) {
  //     console.error("Error fetching client invoices:", err);
  //   }
  // };

  const fetchClientInvoices = async (clientId: string, clientName: string) => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          *,
          cases!case_id (
            id,
            created_at,
            received_date,
            ship_date,
            status,
            patient_name,
            due_date,
            case_number,
            client:clients!client_id (
              id,
              client_name,
              phone,
              street,
              city,
              state,
              zip_code,
              tax_rate
            ),
            doctor:doctors!doctor_id (
              id,
              name,
              client:clients!client_id (
                id,
                client_name,
                phone
              )
            ),
            tag:working_tags!working_tag_id (
              name,
              color
            ),
            product_ids:case_products!id (
              id,
              products_id
            )
          )
        `)
        .eq("client_id", clientId)
        .in("status", ["unpaid", "partially_paid"]);

      if (error) {
        console.error("Error fetching invoices:", error);
        return;
      }

      const enrichedInvoices = await Promise.all((invoices || []).map(async (invoice) => {
        const singleCase = invoice.cases;
        const productsIdArray = singleCase?.product_ids?.map((p: { products_id: any; }) => p.products_id) || [];
        const caseProductIds = singleCase?.product_ids?.map((p: { id: any; }) => p.id) || [];

        let products: { discounted_price: any; teethProduct: any; id: any; name: any; price: any; material: { name: any; }[]; }[] = [];
        let discountedPriceData: any[] = [];
        let teethProductData: any[] = [];

        if (productsIdArray.length > 0) {
          const { data: productData } = await supabase
            .from("products")
            .select(`
              id,
              name,
              price,
              material:materials!material_id (name)
            `)
            .in("id", productsIdArray);

          const { data: discounted } = await supabase
            .from("discounted_price")
            .select("*")
            .in("product_id", productsIdArray)
            .eq("case_id", singleCase.id);

          discountedPriceData = discounted || [];

          const { data: teeth } = await supabase
            .from("case_product_teeth")
            .select(`
              id,
              is_range,
              tooth_number,
              product_id,
              occlusal_shade:shade_options!occlusal_shade_id (name),
              body_shade:shade_options!body_shade_id (name),
              gingival_shade:shade_options!gingival_shade_id (name),
              stump_shade:shade_options!stump_shade_id (name)
            `)
            .in("product_id", productsIdArray)
            .in("case_product_id", caseProductIds);

          teethProductData = teeth || [];

          products = (productData || []).flatMap(product => {
            const relevantDiscounts = discountedPriceData.filter(
              d => d.product_id === product.id
            );
            const relevantTeeth = teethProductData.filter(
              t => t.product_id === product.id
            );

            return relevantTeeth.map((tp, idx) => ({
              ...product,
              discounted_price: relevantDiscounts[idx] || null,
              teethProduct: tp,
            })).filter(p => p.teethProduct?.tooth_number);
          });
        }

        return {
          ...invoice,
          total_amount: Number(invoice.total_amount || 0),
          amount_paid: Number(invoice.amount_paid || 0),
          due_amount: Number(invoice.due_amount || 0),
          case_number: singleCase?.case_number || "",
          case: singleCase,
          client: singleCase?.client || null,
          doctor: singleCase?.doctor || null,
          products: products,
          invoice: (singleCase?.invoice || []).map((inv: any) => ({
            id: inv.id,
            case_id: inv.case_id,
            amount: Number(inv.amount || 0),
            taxes: Number(inv.taxes || 0),
            status: inv.status || "",
            due_amount: Number(inv.due_amount || 0),
            due_date: inv.due_date || null
          }))
        };
      }));

      setSelectedClientInvoices(enrichedInvoices);
      setSelectedClientName(clientName);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error fetching client invoices:", err);
    }
  };



  useEffect(() => {
    const getPaymentList = async () => {
      setLoading(true);

      try {
        const lab = await getLabIdByUserId(user?.id as string);

        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }

        const { data: balanceList, error: balanceListError } = await supabase
          .from("balance_tracking")
          .select(
            `
               created_at,
              client_id,
              outstanding_balance,
              credit,
              this_month,
              last_month,
              days_30_plus,
              days_60_plus,
              days_90_plus,
              total,
              lab_id,
              clients!client_id ( client_name )
              `
          )
          .eq("lab_id", lab.labId);

        if (balanceListError) {
          console.error("Error fetching products for case:", balanceListError);
          return;
        }

        console.log("balanceList (raw data)", balanceList);

        // Transform the data to align with the expected type
        const transformedBalanceList = balanceList?.map((balance: any) => ({
          ...balance,
          client_name: balance.clients?.client_name, // Directly access client_name
        }));

        setBalanceList(transformedBalanceList as BalanceTrackingItem[]);
      } catch (err) {
        console.error("Error fetching payment list:", err);
      } finally {
        setLoading(false);
      }
    };

    getPaymentList();
  }, []);
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };
  const toggleSelectAll = () => {
    if (selectedInvoices.length === selectedClientInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(selectedClientInvoices.map(invoice => invoice.id));
    }
  };
  const handleExportCSV = (invoices: any[], clientName: string) => {
    const invoicesToExport = selectedInvoices.length > 0
      ? selectedClientInvoices.filter(invoice => selectedInvoices.includes(invoice.id))
      : selectedClientInvoices;

    if (invoicesToExport.length === 0) return;
    if (invoices.length === 0) return;

    // Create CSV header
    const csvHeader = [
      'Invoice Number,Date,Total,Paid,Outstanding,Status'
    ].join('\n');

    // Create CSV body
    const csvBody = invoices.map(invoice => {
      const invNumber = invoice.case_number ?
        `INV-${invoice.case_number.split('-').slice(1).join('-')}` : '';
      const date = new Date(invoice.created_at).toLocaleDateString();
      const total = invoice.amount;
      const paid = invoice.amount - invoice.due_amount;
      const outstanding = invoice.due_amount;
      const status = invoice.status.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase());

      return `${invNumber},${date},${total},${paid},${outstanding},${status}`;
    }).join('\n');

    // Add totals row
    const totals = [
      '',
      'Totals:',
      invoices.reduce((sum, inv) => sum + inv.amount, 0),
      invoices.reduce((sum, inv) => sum + (inv.amount - inv.due_amount), 0),
      invoices.reduce((sum, inv) => sum + inv.due_amount, 0),
      ''
    ].join(',');

    const csv = `${csvHeader}\n${csvBody}\n${totals}`;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName}-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBatchPrint = (invoices: any[], clientName: string) => {
    const invoicesToPrint = selectedInvoices.length > 0
      ? selectedClientInvoices.filter(invoice => selectedInvoices.includes(invoice.id))
      : selectedClientInvoices;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
    <html>
      <head>
        <title>Invoices - ${clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #eee; }
        </style>
      </head>
      <body>
        <h2>Outstanding Invoices - ${clientName}</h2>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(invoice => {
      const invNumber = invoice.case_number ?
        `INV-${invoice.case_number.split('-').slice(1).join('-')}` : '';
      return `
                <tr>
                  <td>${invNumber}</td>
                  <td>${new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td>${formatCurrency(invoice.amount)}</td>
                  <td>${formatCurrency(invoice.amount - invoice.due_amount)}</td>
                  <td>${formatCurrency(invoice.due_amount)}</td>
                  <td>${invoice.status.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m: any) => m.toUpperCase())}</td>
                </tr>
              `;
    }).join('')}
            <tr class="total-row">
              <td colspan="2">Total Invoices: ${invoices.length}</td>
              <td>${formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}</td>
              <td>${formatCurrency(invoices.reduce((sum, inv) => sum + (inv.amount - inv.due_amount), 0))}</td>
              <td>${formatCurrency(invoices.reduce((sum, inv) => sum + inv.due_amount, 0))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleCaseClick = (invoice: any) => {
    console.log("Invoice clicked:", invoice);
    // The invoice IS the case since we're querying the cases table
    const caseId = invoice?.id;
    if (caseId) {
      setSelectedCase(caseId);
      setIsCaseDrawerOpen(true);
    } else {
      console.error("No case ID found in invoice:", invoice);
    }
  };


  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-center">Outstanding Balance</TableHead>
              <TableHead className="text-center">Credit Balance</TableHead>
              <TableHead className="text-center">This Month</TableHead>
              <TableHead className="text-center">Last Month</TableHead>
              <TableHead className="text-center">30+ Days</TableHead>
              <TableHead className="text-center">60+ Days</TableHead>
              <TableHead className="text-center">90+ Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBalances.map((balance) => (
              <TableRow key={balance.id}>
                <TableCell>{balance.client_name}</TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => fetchClientInvoices(balance.client_id, balance.client_name)}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    {formatCurrency(balance.outstanding_balance)}
                  </button>
                </TableCell>
                <TableCell
                  className={`${balance.credit > 0 ? "bg-red-500 text-white my-0 h-12 flex justify-center items-center" : ""
                    } text-center`}
                >
                  <div
                    className={`${balance.credit > 0 ? "bg-red-500 text-white my-0 h-12 flex justify-center items-center" : ""
                      } text-center`}
                  >
                    {balance.credit ? formatCurrency(balance.credit) : 0}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.this_month)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.last_month)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_30_plus)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_60_plus)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(balance.days_90_plus)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={1}>Totals</TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.outstandingBalance)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.creditBalance)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.thisMonth)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.lastMonth)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.days30Plus)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.days60Plus)}
              </TableCell>
              <TableCell className="text-center">
                {formatCurrency(totals.days90Plus)}
              </TableCell>
              <TableCell colSpan={1}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[600px]">
          <SheetHeader>
            {/* <SheetTitle>Outstanding Invoices - {selectedClientName}</SheetTitle> */}
            <div className="flex justify-between items-center">
              <SheetTitle> Outstanding Invoices - <span style={{ color: "blue" }}>{selectedClientName}</span></SheetTitle>
              <div className="flex gap-1 mr-3">
                <Button variant="outline"
                  onClick={() => handleBatchPrint(selectedClientInvoices, selectedClientName)}
                  disabled={selectedClientInvoices.length === 0}
                >
                  Batch Print
                </Button>
                <Button variant="outline"
                  onClick={() => handleExportCSV(selectedClientInvoices, selectedClientName)}
                  disabled={selectedClientInvoices.length === 0}
                >
                  Export
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClientInvoices.map((invoice) => {
                  const formattedStatus = invoice.status
                    .replace(/_/g, ' ')
                    .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase());

                  return (
                    <TableRow key={invoice.id}>
                      {/* <TableCell>
                        {(() => {
                          const caseNumber = invoice?.case_number ?? "";
                          return caseNumber;
                          // const parts = caseNumber.split("-");
                          // parts[0] = "INV";
                          // return parts.join("-");
                        })()}
                      </TableCell> */}
                      <TableCell className="whitespace-nowrap">
                        <HoverCard openDelay={200}>
                          <HoverCardTrigger asChild>
                            <button
                              type="button"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCaseClick(invoice);
                              }}
                            >
                              {invoice?.case_number ?? ""}
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-[600px] p-0 overflow-hidden max-h-[800px]"
                            side="right"
                            sideOffset={20}
                            align="start"
                          >
                            <div className="w-full">
                              <div
                                className="w-full transform scale-[0.85] origin-top-left -mt-4"
                                style={{
                                  transform: "scale(0.85) translateX(20px)",
                                }}
                              >
                                <InvoiceTemplate
                                  paperSize="LETTER"
                                  caseDetails={[invoice]}
                                />
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>

                      <TableCell>{formattedStatus}</TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount - invoice.due_amount)}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.due_amount)}</TableCell>
                    </TableRow>
                  )
                })}
                {/* Totals Row */}
                {selectedClientInvoices.length > 0 && (
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={3}>
                      Total Invoices: {selectedClientInvoices.length}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        selectedClientInvoices.reduce((sum, inv) => sum + inv.amount, 0)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        selectedClientInvoices.reduce((sum, inv) => sum + (inv.amount - inv.due_amount), 0)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        selectedClientInvoices.reduce((sum, inv) => sum + inv.due_amount, 0)
                      )}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BalanceList;
