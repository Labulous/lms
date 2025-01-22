import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CaseStatus } from "@/types/supabase";

interface InvoiceActionsProps {
  status: CaseStatus;
  invoiceStatus: string | null;
  onEditInvoice: () => void;
  onApproveInvoice: () => void;
}

const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  status,
  invoiceStatus,
  onEditInvoice,
  onApproveInvoice,
}) => {
  const getButtonStates = () => {
    // If no invoice exists
    if (!invoiceStatus) {
      return {
        canEdit: false,
        canApprove: false,
        message: "No invoice exists for this case",
      };
    }

    // Terminal invoice states
    if (["paid", "partially_paid", "cancelled"].includes(invoiceStatus)) {
      return {
        canEdit: false,
        canApprove: false,
        message: `Cannot modify invoice in ${invoiceStatus} status`,
      };
    }

    // Draft invoice states
    if (invoiceStatus === "draft") {
      if (status === "completed") {
        return {
          canEdit: true,
          canApprove: true,
          message: "Invoice can be edited or approved",
        };
      } else {
        return {
          canEdit: true,
          canApprove: false,
          message: "Case must be completed before invoice can be approved",
        };
      }
    }

    // Unpaid/Overdue states
    if (["unpaid", "overdue"].includes(invoiceStatus)) {
      return {
        canEdit: true,
        canApprove: false,
        message: "Invoice can only be edited",
      };
    }

    return {
      canEdit: false,
      canApprove: false,
      message: "Unknown state",
    };
  };

  const buttonState = getButtonStates();

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditInvoice}
                disabled={!buttonState.canEdit}
              >
                Edit Invoice
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{buttonState.message}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="default"
                size="sm"
                onClick={onApproveInvoice}
                disabled={!buttonState.canApprove}
              >
                Approve & Invoice
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{buttonState.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default InvoiceActions;
