import { format } from "date-fns";

export function calculateDueDate(
  dueDate?: string,
  client?: { client_name: string; additional_lead_time?: string }
): string {
  if (!dueDate) return "TBD"; // Handle missing date

  const parsedDate = new Date(dueDate);
  if (isNaN(parsedDate.getTime())) return "Invalid Date"; // Handle invalid dates

  const additionalLeadTime = client?.additional_lead_time ? Number(client.additional_lead_time) : 0;

  if (!isNaN(additionalLeadTime) && additionalLeadTime > 0) {
    parsedDate.setDate(parsedDate.getDate() + additionalLeadTime);
  }

  return format(parsedDate, "MMM dd, yyyy");
}
