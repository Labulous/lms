import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatementList from "@/components/billing/StatementList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateStatementModal } from "@/components/billing/CreateStatementModal";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const Statements = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateStatement = async (data: any) => {
    try {
      setIsLoading(true);
      // TODO: Handle statement creation
      console.log("Creating statement:", data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Statement created successfully");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating statement:", error);
      toast.error("Failed to create statement");
    } finally {
      setIsLoading(false);
    }
  };

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
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            New Statement
          </Button>
        </div>
      </div>

      <StatementList />

      {isCreateModalOpen && (
        <CreateStatementModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateStatement}
        />
      )}
    </main>
  );
};

export default Statements;
