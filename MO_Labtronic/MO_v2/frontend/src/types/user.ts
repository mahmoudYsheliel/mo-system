export type UserType =
  | "DesignEngineer"
  | "ProductionEngineer"
  | "ProjectManager"
  | "Supervisor"
  | "Admin"
  | "Any";

  
  export interface RouterMetaData {
  authRequired: boolean;
  userType: UserType[];
}
