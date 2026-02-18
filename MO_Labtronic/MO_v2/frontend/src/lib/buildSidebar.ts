import DashBoardIcon from "@/icons/DashBoardIcon.vue";
import ProjectIcon from "@/icons/ProjectIcon.vue";
import LabIcon from "@/icons/LabIcon.vue";
import UniversityIcon from "@/icons/UniversityIcon.vue";
import AddIcon from "@/icons/AddIcon.vue";
import NotificationIcon from "@/icons/NotificationIcon.vue";
import LogOutIcon from "@/icons/LogOutIcon.vue";
import MOIcon from "@/icons/MOIcon.vue";
import type { Router } from "vue-router";
import type { SideBarItem } from "@/types/sidebarActions";
import { useAuth } from "@/stores/auth";

export function createSideBarmMinItems(router: Router): SideBarItem[] {
  return [
    {
      name: "Dashboard",
      icon: DashBoardIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/Dashboard");
      },
    },
    {
      name: "Manufacturing Orders",
      icon: MOIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/manufacturing-orders");
      },
    },
    {
      name: "Projects",
      icon: ProjectIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/projects");
      },
    },
    {
      name: "Labs",
      icon: LabIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/labs");
      },
    },
    {
      name: "Universities",
      icon: UniversityIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/universities");
      },
    },
    // {
    //   name: "Add Entity",
    //   icon: AddIcon,
    //   accessedBy: ["DesignEngineer"],
    //   command: () => {
    //     router.push("/");
    //   },
    // },
    {
      name: "Notifications",
      icon: NotificationIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        router.push("/notification");
      },
    },
  ];
}



export function createSideBarActions(router: Router): SideBarItem[] {
  const auth = useAuth()
  return [
    {
      name: "Log out",
      icon: LogOutIcon,
      accessedBy: [
        "DesignEngineer",
        "ProductionEngineer",
        "ProjectManager",
        "Supervisor",
      ],
      command: () => {
        auth.logout()
      },
    },
  ];
}