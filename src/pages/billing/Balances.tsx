import { Button } from "@/components/ui/button";
import BalanceList from "@/components/billing/BalanceList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import ClientBalanceList from "@/components/billing/ClientBalanceList";

const Balances = () => {
  const { user } = useAuth();

  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Balances</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage client balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Select>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Print" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print-all">Print All</SelectItem>
              <SelectItem value="print-selected">Print Selected</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Reminder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="send-all">Send to All</SelectItem>
              <SelectItem value="send-selected">Send to Selected</SelectItem>
              <SelectItem value="customize">Customize Message</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {user?.role === "client" ? <ClientBalanceList /> : <BalanceList />}
    </main>
  );
};

export default Balances;
