import UserProfileIcon from "@/icons/UserProfileIcon.vue";
import LogOutIcon from "@/icons/LogOutIcon.vue";
import { logout } from "@/services/user.service";
import type { ProfileOption } from "@/types/profile-option";
import type { Router } from "vue-router";

export function getProfileOptions(router: Router): ProfileOption[] {
  return [
    {
      label: "Profile",
      iconComp: UserProfileIcon,
      userCommand: () => {
        router.push("/user-profile");
      },
      fill: "#1e90ff",
    },
    {
      label: "Log out",
      iconComp: LogOutIcon,
      userCommand: () => {
        logout();
      },
      fill: "#dc3545",
    },
  ];
}
