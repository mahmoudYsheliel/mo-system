import { getPocketBaseURL } from "@/services/apiService";
import { shareableExtensions } from "@/constants/shareableExtensions";

export function getFileLink(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined
): string | undefined {
  if (!(tableName && recordId && fileName)) return undefined;
  return `${getPocketBaseURL()}/api/files/${tableName}/${recordId}/${fileName}`;
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getDate(d: Date | null) {
  if (!d) return;
  const dayName = d.toDateString().split(" ")[0];
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  return dayName + " " + day + "-" + month + "-" + year;
}

export function getTime(d: Date | null) {
  if (!d) return;
  return `${d.getHours()}:${d.getMinutes()} `;
}

export function getDateStringFromDateTime(date: string, time: string) {
  const [_, d, m, y] = date.split(/[\s-]+/);
  const [h, minute] = time.trimEnd().split(":");
  const pad = (n: string) => String(n).padStart(2, "0");
  const dt = new Date(
    `${y}-${pad(m || "")}-${pad(d || "")}T${pad(h || "")}:${pad(
      minute || ""
    )}:00`
  );
  return dt.toString();
}

export function isSharableFile(fileName: string | undefined) {
  if (!fileName) return false;
  const extension = fileName.toLowerCase().split(".")[1];
  return extension ? shareableExtensions.includes(extension) : false;
}



export function timeSince(eventTime: string) {
  const now = new Date();
  const event = new Date(eventTime);
  const diffMs = now.getTime() - event.getTime(); // difference in milliseconds

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  if(diffDays<5) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  return event.toDateString()
}


