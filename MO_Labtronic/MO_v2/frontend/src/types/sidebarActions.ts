import {type UserType } from "./user";

export type SideBarAction =
  | "Dashboard"
  | "Universities"
  | "Labs"
  | "Projects"
  | "Manufacturing Orders"
  | "Add Entity"
  | "Notifications"
  | "Log out";


  export interface SideBarItem {
  name: SideBarAction;
  icon: any;
  accessedBy: UserType[];
  command: Function;
}

