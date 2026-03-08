export type MOStatus = "Active" | "Completed" | "Not Started" 
export type MOSummaryStatus = MOStatus | "Total";
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
  start?:Date;
  finish?: Date;
  estimated?: Date;
}
