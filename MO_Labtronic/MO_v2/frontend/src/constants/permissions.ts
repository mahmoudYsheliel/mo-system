import type { UserType } from "@/types/user"
import type { Action } from "@/types/actions"
 export const PERMISSIONS: Record<UserType, Action[]> = {
    DesignEngineer: ['add_uni', 'add_lab','add_mo', 'add_project', 'add_parts', 'view_own_mos', 'view_own_projects'],
    ProductionEngineer: ['change_process_status', 'view_own_mos', 'view_own_projects'],
    ProjectManager: ['view_own_projects', 'view_own_mos'],
    Supervisor: ['view_all_labs', 'view_all_uni' ,'view_all_projects', 'view_all_mos'],
    Admin:[],
    Any: []
  }

