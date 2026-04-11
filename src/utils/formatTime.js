// Convert 24-hour time to 12-hour format with AM/PM
export function formatTimeTo12Hour(timeString) {
  if (!timeString) return "";

  // If already has AM/PM, return as is
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return timeString;
  }

  // Parse time (assuming format like "14:00:00" or "14:00")
  const [hours, minutes] = timeString.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return timeString; // Return original if can't parse
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
}

// Format date nicely
export function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
