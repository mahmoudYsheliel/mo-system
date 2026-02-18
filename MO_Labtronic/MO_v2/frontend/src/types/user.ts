export type UserType =
  | "Design Engineer"
  | "Production Engineer"
  | "Project Manager"
  | "Supervisor"
  | "Admin"
  | "Any";

  
  export interface RouterMetaData {
  authRequired: boolean;
  userType: UserType[];
}
