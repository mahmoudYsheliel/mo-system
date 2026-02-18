import type {
  Priority,
  MOType,
  DateType,
  MOSummaryStatus,
} from "@/types/mo-order";
import { type PartStatus } from "@/types/part";
import type { UserType } from "@/types/user";
import type { Notification } from "@/types/notifications";

export const priorityColor: Record<Priority, string> = {
  HIGH: "#E53935",
  MEDIUM: "#FB8C00",
  LOW: "#43A047",
};
export const MOTypeColors: Record<MOType, string> = {
  SheetMetal: "#546E7A",
  Milling: "#1976D2",
  Printing: "#8E24AA",
  Lathe: "#6D4C41",
  Laser: "#E64A19",
  "Work Shop": "#00796B",
  "3D Printion": "#7B1FA2",
};

export const MORepresentativeColors: Partial<Record<UserType, string>> = {
  'Design Engineer': "#1565C0",
  'Production Engineer': "#2E7D32",
  'Project Manager': "#F9A825",
};

export const dateColorMap = (isDuePass: boolean): Record<DateType, string> => {
  return {
    start: "#2E7D32",
    current: isDuePass ? "#1565C0" : "#D32F2F",
    finish: "#6A1B9A",
    estimated: "#FF8C00",
  };
};

export const processColorsMap: Record<string, string> = {
  "Not Started": "#bdbdbd",
  "In Progress": "#2196f3",
  Done: "#4caf50",
  Rejected: "#f44336",
  Cancelled: "#9e9e9e",
};

export const moStatusColorMap: Record<MOSummaryStatus, string> = {
  Active: "#00C2A8",
  Completed: "#2ECC71",
  "Not Started": "#A0AEC0",
  Total: "#007AFF",
};

export const MOStatusColors: Record<PartStatus, string> = {
  "Not Started": moStatusColorMap["Not Started"],
  "In Progress": moStatusColorMap["Active"],
  'Done': moStatusColorMap["Completed"],
  Rejected: "#C62828",
  Cancelled: "#616161",
};

export const notificationColors: Record<
  Notification,
  { color: string; icon: string }
> = {
  mo_created: {
    color: "#22c55e",      // green-500
    icon: "pi pi-flag",
  },
  mo_edited: {
    color: "#F59E0B",      // Light Orange
    icon: "pi pi-pencil",
  },
  mo_completed: {
    color: "#e4b8c6",      // teal-500 
    icon: "pi pi-check",
  },
  mo_note: {
    color: "#7e22ce",      // purple-700
    icon: "pi pi-clipboard",
  },
  process_rejected: {
    color: "#ef4444",      // red-500
    icon: "pi pi-times",
  },
};

export function getNotificationColor(notificationType: string,isRead:boolean) {
  if (isRead) return '#2c2c2c'
  return notificationColors[notificationType as Notification].color;
}
export function getNotificationIcon(notificationType: string) {
  return notificationColors[notificationType as Notification].icon;
}
