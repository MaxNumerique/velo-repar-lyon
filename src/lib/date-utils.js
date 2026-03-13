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
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
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
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
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
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Checks if two date objects (or strings) represent the same hour slot
 */
export function isSameSlot(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate() &&
    d1.getHours() === d2.getHours()
  );
}

/**
 * Checks if the current time is at least 6 hours before the scheduled time
 * @param {string|Date} scheduledAt
 * @returns {boolean}
 */
export function canModifyIntervention(scheduledAt) {
  if (!scheduledAt) return true;
  const now = new Date();
  const appointmentDate = new Date(scheduledAt);
  const diffInHours = (appointmentDate - now) / (1000 * 60 * 60);
  return diffInHours >= 6;
}
