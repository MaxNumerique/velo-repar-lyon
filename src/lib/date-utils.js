/**
 * Date Utilities
 */

/**
 * Generates the next N days, excluding Sundays
 * @param {number} count - Number of days to generate
 * @returns {Date[]}
 */
export function getAvailableDays(count = 7) {
  const days = [];
  let current = new Date();

  // Reset time to midnight for consistency if needed,
  // but usually we want to start from today

  while (days.length < count) {
    if (current.getDay() !== 0) {
      // Skip Sunday
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Standard date formatting for France
 */
export function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Standard time formatting for France
 */
export function formatTime(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats full date with weekday
 */
export function formatFullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
