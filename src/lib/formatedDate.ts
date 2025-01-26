import { parseISO, isValid } from "date-fns"; // To parse the ISO string
import { formatInTimeZone, format } from "date-fns-tz"; // To format the date in a specific time zone

export const formatDate = (dateString: string) => {
  try {
    // Format the date string in UTC with the "Jan 25, 2025" format
    const formattedUtcDate = formatInTimeZone(dateString, "UTC", "MMM d, yyyy");

    // Return the formatted UTC date (e.g., Jan 25, 2025)
    return formattedUtcDate;
  } catch (err) {
    return "Invalid Date";
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
