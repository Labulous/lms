import { Button } from "@/components/ui/button";
import AdjustmentList from "@/components/billing/AdjustmentList";

const Adjustments = () => {
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
          <Button>New Adjustment</Button>
        </div>
      </div>

      <AdjustmentList />
    </main>
  );
};

export default Adjustments;
