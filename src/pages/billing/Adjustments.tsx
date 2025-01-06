import { useState } from "react";
import { Button } from "@/components/ui/button";
import AdjustmentList from "@/components/billing/AdjustmentList";
import { NewCreditModal } from "@/components/billing/NewCreditModal";
import { NewDebitModal } from "@/components/billing/NewDebitModal";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const Adjustments = () => {
  const [isNewCreditModalOpen, setIsNewCreditModalOpen] = useState(false);
  const [isNewDebitModalOpen, setIsNewDebitModalOpen] = useState(false);
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  const [isDebitLoading, setIsDebitLoading] = useState(false);

  const handleCreditSubmit = async (data: any) => {
    try {
      setIsCreditLoading(true);
      // TODO: Implement credit creation logic
      console.log("Creating credit:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Credit created successfully");
      setIsNewCreditModalOpen(false);
    } catch (error) {
      console.error("Error creating credit:", error);
      toast.error("Failed to create credit");
    } finally {
      setIsCreditLoading(false);
    }
  };

  const handleDebitSubmit = async (data: any) => {
    try {
      setIsDebitLoading(true);
      // TODO: Implement debit creation logic
      console.log("Creating debit:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Debit created successfully");
      setIsNewDebitModalOpen(false);
    } catch (error) {
      console.error("Error creating debit:", error);
      toast.error("Failed to create debit");
    } finally {
      setIsDebitLoading(false);
    }
  };

  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Adjustments</h2>
          <p className="text-sm text-muted-foreground">
            Manage credit and debit adjustments for clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewCreditModalOpen(true)}
            disabled={isCreditLoading}
          >
            {isCreditLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            New Credit
          </Button>
          <Button
            onClick={() => setIsNewDebitModalOpen(true)}
            disabled={isDebitLoading}
          >
            {isDebitLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            New Debit
          </Button>
        </div>
      </div>

      <AdjustmentList />

      {isNewCreditModalOpen && (
        <NewCreditModal
          onClose={() => setIsNewCreditModalOpen(false)}
          onSubmit={handleCreditSubmit}
        />
      )}

      {isNewDebitModalOpen && (
        <NewDebitModal
          onClose={() => setIsNewDebitModalOpen(false)}
          onSubmit={handleDebitSubmit}
        />
      )}
    </main>
  );
};

export default Adjustments;
