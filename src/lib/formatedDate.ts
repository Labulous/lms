import { isValid, parseISO, format } from "date-fns";

export const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid Date";
    }
    return format(date, "MMM d, yyyy");
  } catch (err) {
    return "Invalid Date";
  }
};
export const formatDateWithTime = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid Date";
    }
    // Format date with time, hours, minutes, and AM/PM
    return format(date, "MMM d, yyyy hh:mm a");
  } catch (err) {
    return "Invalid Date";
  }
};
