import CodeIcon from "@/icons/CodeIcon.vue";
import ThicknessIcon from "@/icons/ThicknessIcon.vue";
import ColorIcon from "@/icons/ColorIcon.vue";
import MaterialTypeIcon from "@/icons/MaterialTypeIcon.vue";
import CountIcon from "@/icons/CountIcon.vue";
import ProcessOrderIcon from "@/icons/ProcessOrderIcon.vue";
import type{ PartData } from "@/types/part";

export const partDataIcon: Partial<Record<PartData, any>> = {
  Code: CodeIcon,
  Quantity: CountIcon,
  Material: MaterialTypeIcon,
  Thickness: ThicknessIcon,
  Color: ColorIcon,
  Processes: ProcessOrderIcon,
};