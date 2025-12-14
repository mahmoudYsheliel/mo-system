export type MOSummaryStatus = "Active" | "Completed" | "Not Started" | "Total";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type MOType =
  | "SheetMetal"
  | "Milling"
  | "Printing"
  | "Lathe"
  | "Laser"
  | "Work Shop"
  | "3D Printion";
export type DateType = "start" | "current" | "finish" | "estimated";
export interface BasicInfo {
  type?: MOType;
  priority?: Priority;
  status?: MOSummaryStatus;
}
export interface MODate {
  start?: string;
  finish?: string;
  estimated?: string;
}
