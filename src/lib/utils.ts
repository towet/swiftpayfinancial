import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const APP_TIME_ZONE = (import.meta as any)?.env?.VITE_APP_TIME_ZONE || "Africa/Nairobi";

export function parseApiTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;

  let s = String(timestamp).trim();
  if (!s) return null;

  if (!s.includes("T") && s.includes(" ")) {
    s = s.replace(" ", "T");
  }

  const hasTimeZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const normalized = hasTimeZone ? s : `${s}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatTimeInAppTz(timestamp: string | null | undefined): string {
  const date = parseApiTimestamp(timestamp);
  if (!date) return "";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  });
}
