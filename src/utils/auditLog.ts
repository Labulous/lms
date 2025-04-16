import { supabase } from "../lib/supabase";

type ActionType = "CREATE" | "UPDATE" | "DELETE";
type EntityType = "case" | "invoice" | "payment";

interface AuditLogPayload {
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  changes: any;
  performedBy: string; // Supabase auth user ID
}

export const logAuditAction = async ({
  actionType,
  entityType,
  entityId,
  changes,
  performedBy,
}: AuditLogPayload) => {
  const { error } = await supabase.from("audit_logs").insert([
    {
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      changes,
      performed_by: performedBy,
      timestamp: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error logging audit:", error);
  }
};
