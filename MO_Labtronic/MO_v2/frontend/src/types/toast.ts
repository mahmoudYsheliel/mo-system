export type Severity =
  | "error"
  | "secondary"
  | "info"
  | "success"
  | "warn"
  | "contrast";

export interface ToastNotification {
  severity: Severity;
  summary: string;
  detail: string;
  life: number;
}
