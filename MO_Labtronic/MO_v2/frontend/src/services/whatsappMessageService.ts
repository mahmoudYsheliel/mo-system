import {type FileNameUrl } from "@/types/moFile";
export function buildWhatsAppMessage(
  projectName: string,
  MOName: string,
  items: FileNameUrl[]
) {
  return (
    `${projectName} > ${MOName} \n\n` +
    items.map((item, i) => `* File ${i + 1} \n🔗 ${item.url}`).join("\n\n\n")
  );
}