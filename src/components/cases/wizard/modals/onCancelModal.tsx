import React, { SetStateAction, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CaseStep } from "../../CaseProgress";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface OnCancelModalProps {
  onClose: () => void;
  caseId: string;
  workstations: CaseStep[];
  fetchCaseData: (isRefresh: boolean) => void;
}

const OnCancelModal = ({
  onClose,
  caseId,
  workstations,
  fetchCaseData,
}: OnCancelModalProps) => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Ensure pointer-events are reset when the component unmounts
    return () => {
      document.body.style.pointerEvents = "auto";
    };
  }, []);

  const handleClose = () => {
    document.body.style.pointerEvents = "auto"; // Reset pointer-events
    onClose();
  };
  const handleCaseCancel = async () => {
    setLoading(true);
    try {
      const { error: updateCaseError } = await supabase
        .from("cases")
        .update({ status: "cancelled" })
        .eq("id", caseId);

      if (updateCaseError) {
        console.error("Error updating case status:", updateCaseError);
        toast.error("Failed to cancel the case");
        return;
      }

      const { data: invoiceData, error: fetchInvoiceError } = await supabase
        .from("invoices")
        .select("id")
        .eq("case_id", caseId)
        .single();

      if (fetchInvoiceError) {
        toast.error("Failed to fetch associated invoice");
        return;
      }

      if (!invoiceData) {
        toast.error("No invoice found for this case");
        setLoading(false);

        return;
      }

      const { error: updateInvoiceError } = await supabase
        .from("invoices")
        .update({ status: "cancelled" })
        .eq("id", invoiceData.id);

      if (updateInvoiceError) {
        toast.error("Failed to cancel the invoice");
        setLoading(false);

        return;
      }

      toast.success("Case and associated invoice cancelled successfully");
      setLoading(false);
      fetchCaseData(true);
      onClose();
    } catch (err) {
      console.error("Error in handleCaseCancel:", err);
      toast.error("An unexpected error occurred while cancelling the case");
    }
  };

  const isInProgress = workstations.some(
    (item) => item.status === "in_progress"
  );

  return (
    <Dialog
      open
      onOpenChange={() => {
        handleClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Case Cancel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {isInProgress
                ? "Some Workstations are in Progress. Are you Sure You want to Cancel the Case?"
                : "Are you Sure You want to Cancel the Case?"}
            </h3>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>

              <Button onClick={() => handleCaseCancel()} disabled={loading}>
                {loading ? "Updating" : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnCancelModal;
