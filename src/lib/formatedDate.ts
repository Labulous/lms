import { parseISO, isValid } from "date-fns"; // To parse the ISO string
import { formatInTimeZone, format } from "date-fns-tz"; // To format the date in a specific time zone

export const formatDate = (dateString: string | null) => {
  try {
    if (!dateString) return "-";
    
    // Parse the date string first to validate it
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) return "-";
    
    // Format the date string in UTC with the "Jan 25, 2025" format
    const formattedUtcDate = formatInTimeZone(dateString, "UTC", "MMM d, yyyy");
    return formattedUtcDate;
  } catch (err) {
    return "-";
  }
};
export const formatDateWithTime = (dateString: string) => {
  try {
    // Format the date string in UTC with time (e.g., Jan 25, 2025 01:30 PM)
    const formattedDateWithTime = formatInTimeZone(dateString, "UTC", "MMM d, yyyy hh:mm a");
    
    // Return the formatted date with time
    return formattedDateWithTime;
  } catch (err) {
    return "Invalid Date";
  }
};

export const formatDateWithTime_appt = (dateString: string) => {
  if (!dateString) return "Invalid Date";

  // Convert "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ssZ" for proper UTC parsing
  const formattedDateString = dateString.replace(" ", "T") + "Z";

  const date = new Date(formattedDateString);

  if (isNaN(date.getTime())) return "Invalid Date"; // Validate the date

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


