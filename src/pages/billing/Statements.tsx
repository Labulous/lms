import { Button } from "@/components/ui/button";
import StatementList from "@/components/billing/StatementList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Statements = () => {
  return (
    <main className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Statements</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track client statements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Print" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print-all">Print All</SelectItem>
              <SelectItem value="print-selected">Print Selected</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email-all">Email All</SelectItem>
              <SelectItem value="email-selected">Email Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Rollback</Button>
          <Button>New Statement</Button>
        </div>
      </div>

      <StatementList />
    </main>
  );
};

export default Statements;
