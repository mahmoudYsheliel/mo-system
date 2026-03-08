import DashBoardIcon from "@/icons/DashBoardIcon.vue";
import ProjectIcon from "@/icons/ProjectIcon.vue";
import LabIcon from "@/icons/LabIcon.vue";
import UniversityIcon from "@/icons/UniversityIcon.vue";
import AddIcon from "@/icons/AddIcon.vue";
import NotificationIcon from "@/icons/NotificationIcon.vue";
import LogOutIcon from "@/icons/LogOutIcon.vue";
import MOIcon from "@/icons/MOIcon.vue";
import type { Router } from "vue-router";
import type { SideBarItem } from "@/types/sidebar-actions";
import { logout } from "@/services/user.service";

export function createSideBarmMinItems(router: Router): SideBarItem[] {
  return [
    {
      name: "Dashboard",
      icon: DashBoardIcon,
      accessedBy: [
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
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
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
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
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
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
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
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
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
        "Supervisor",
      ],
      command: () => {
        router.push("/universities");
      },
    },
    {
      name: "Notifications",
      icon: NotificationIcon,
      accessedBy: [
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
        "Supervisor",
      ],
      command: () => {
        router.push("/notification");
      },
    },
  ];
}



export function createSideBarActions(router: Router): SideBarItem[] {
  return [
    {
      name: "Log out",
      icon: LogOutIcon,
      accessedBy: [
        "Design Engineer",
        "Production Engineer",
        "Project Manager",
        "Supervisor",
      ],
      command: () => {
        logout()
      },
    },
  ];
}