/**
 * Shared time formatting helper for telemetry and edge data.
 * In HTTP mode, every timestamp from the backend is ISO 8601 UTC.
 * Parses ISO strings and shows local time as "HH:mm:ss",
 * and falls back to showing the raw string if it cannot be parsed.
 */
export function formatTime(timestamp?: string | number | null): string {
  if (timestamp === undefined || timestamp === null) return '--';

  if (typeof timestamp === 'number') {
    const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    return String(timestamp);
  }

  const str = String(timestamp).trim();
  if (!str) return '--';

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
  } catch {
    // fallback to returning str
  }

  return str;
}
