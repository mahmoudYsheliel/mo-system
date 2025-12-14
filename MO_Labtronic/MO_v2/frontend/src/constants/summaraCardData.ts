import MOIcon from "@/icons/MOIcon.vue";
import BoltIcon from "@/icons/BoltIcon.vue";
import CompletedIcon from "@/icons/CompletedIcon.vue";
import WaitingIcon from "@/icons/WaitingIcon.vue";
import type { MOSummaryStatus } from "@/types/mo-order";
import type { SummaryData } from "@/types/summaryData";
import { moStatusColorMap } from "./colors";


export const summaryCardsConf: Record<MOSummaryStatus, SummaryData> = {
  Total: {
    Element: MOIcon,
    count: 0,
    mainColor: "white",
    bgColor: moStatusColorMap['Total'],
  },
  Active: {
    Element: BoltIcon,
    count: 0,
    mainColor: "white",
    bgColor:  moStatusColorMap['Active'],
  },
  "Not Started": {
    Element: WaitingIcon,
    count: 0,
    mainColor: "white",
    bgColor:  moStatusColorMap['Not Started'],
  },
  Completed: {
    Element: CompletedIcon,
    count: 0,
    mainColor: "white",
    bgColor:  moStatusColorMap['Completed'],
  },
};



