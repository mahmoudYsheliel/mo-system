import { type ReturnMessage } from "@/models/return-message.model";
import { getFileLink } from "../lib/helper-functions";

export function downloadFile(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined,
): ReturnMessage {
  const url = getFileLink(tableName, recordId, fileName);
  if (!(url && fileName))
    return { success: false, msg: "Data missing", data: null };

  const downloadUrl = url.includes("?")
    ? `${url}&download=1`
    : `${url}?download=1`;

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { success: true, msg: "File download triggered", data: null };
}
