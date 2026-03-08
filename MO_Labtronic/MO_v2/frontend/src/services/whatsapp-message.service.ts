import {type FileNameUrlModel } from "@/models/file-name-url.model";
export function buildWhatsAppMessage(
  projectName: string,
  MOName: string,
  items: FileNameUrlModel[]
) {
  return (
    `${projectName} > ${MOName} \n\n` +
    items.map((item, i) => `* File ${i + 1} \n🔗 ${item.url}`).join("\n\n\n")
  );
}