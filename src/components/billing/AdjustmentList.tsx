import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, MoreVertical, PrinterIcon, X } from "lucide-react";
import { Adjustment } from "@/pages/billing/Adjustments";
import { formatDate } from "@/lib/formatedDate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import AdjustmentReceiptPreviewModal from "./print/AdjustmentReceiptPreviewModal";
import { labDetail } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Mock data for development
const mockAdjustments = [
  {
    id: "1",
    date: new Date("2024-03-01"),
    client: "Doctor, Test",
    description: "test",
    creditAmount: 200.0,
    debitAmount: 0,
  },
  {
    id: "2",
    date: new Date("2023-12-19"),
    client: "Test Client",
    description: "test credit",
    creditAmount: 200.0,
    debitAmount: 320.0,
  },
];

const AdjustmentList = ({ adjustments }: { adjustments: Adjustment[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedAdjustments, setSelectedAdjustments] = useState<string[]>([]);

  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [labs, setLabs] = useState<labDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleSelectsAdjustment = (adjustmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdjustments([...selectedAdjustments, adjustmentId]);
    } else {
      setSelectedAdjustments(
        selectedAdjustments.filter((id) => id !== adjustmentId)
      );
    }
  };

  const handleSelectAdjustment = (adjustmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdjustments([adjustmentId]);
    } else {
      setSelectedAdjustments([]);
    }
  };

  const handleSelectAllAdjustment = (checked: boolean) => {
    if (checked) {
      setSelectedAdjustments(adjustments.map((adjust) => adjust.id.toString()));
    } else {
      setSelectedAdjustments([]);
    }
  };

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
             lab:labs!lab_id (
              id,
              name,
              attachements,
              office_address_id,
              office_address:office_address!office_address_id (            
                email,             
                phone_number,
                address_1,
                address_2,
                city,
                state_province,
                zip_postal,
                country
              )
             )
            `
          )
          .eq("id", user?.id)
          .or("is_archive.is.null,is_archive.eq.false");

        if (error) {
          throw new Error(error.message);
        }

        // Assuming you want the first lab's details
        if (data && data.length > 0) {
          const labData = data[0].lab;
          setLabs(labData as any);
        }
      } catch (err: any) {
        console.error("Error fetching labs data:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLabs();
    }
  }, [user?.id]);

  console.log(adjustments, "adjustmentsadjustments");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center">
          {selectedAdjustments && selectedAdjustments.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground mr-2">
                {selectedAdjustments.length}{" "}
                {selectedAdjustments.length === 1 ? "item" : "items"} selected
              </span>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsPreviewModalOpen(true)}
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Invoices
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              placeholder="Search adjustments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    adjustments.length > 0 &&
                    selectedAdjustments.length === adjustments.length
                  }
                  onCheckedChange={handleSelectAllAdjustment}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Credit Amount</TableHead>
              <TableHead className="text-right">Debit Amount</TableHead>
              <TableHead className="w-[30px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedAdjustments.includes(
                      adjustment?.id.toString()
                    )}
                    onCheckedChange={(checked) =>
                      handleSelectsAdjustment(
                        adjustment?.id.toString(),
                        checked as boolean
                      )
                    }
                    aria-label={`Select adjustment ${adjustment?.id.toString()}`}
                  />
                </TableCell>
                <TableCell>{formatDate(adjustment.payment_date)}</TableCell>
                <TableCell>{adjustment.client.client_name}</TableCell>
                <TableCell>{adjustment.description}</TableCell>
                <TableCell className="text-right">
                  {adjustment?.credit_amount != null &&
                  adjustment.credit_amount > 0
                    ? `$${(adjustment.credit_amount || 0).toFixed(2)}`
                    : "-"}
                </TableCell>

                <TableCell className="text-right">
                  {adjustment.debit_amount && adjustment?.debit_amount > 0
                    ? `$${adjustment.debit_amount.toFixed(2)}`
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <div className="">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="flex space-x-4 bg-gray-50 p-2 rounded-md"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          handleSelectAdjustment(
                            adjustment.id.toString(),
                            true as boolean
                          );
                          setIsPreviewModalOpen(true);
                        }}
                        className="cursor-pointer p-2 rounded-md hover:bg-gray-300"
                        style={{ display: "flex", flexDirection: "row" }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Select defaultValue="20">
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">1-2 of 2</div>
      </div>

      {isPreviewModalOpen && (
        <AdjustmentReceiptPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
          }}
          caseDetails={(() => {
            const filteredData = adjustments.filter((adjust: any) =>
              selectedAdjustments.includes(adjust.id.toString())
            );
            return filteredData;
          })()}
          labData={labs}
        />
      )}
    </div>
  );
};

export default AdjustmentList;
