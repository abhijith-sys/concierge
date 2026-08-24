const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function isOpenNow(hours?: Record<string, [string, string] | null> | null, now = new Date()) {
  if (!hours || typeof hours !== "object") return false;
  const interval = hours[dayNames[now.getDay()]!];
  if (!interval || interval.length !== 2) return false;
  const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return current >= interval[0] && current <= interval[1];
}
