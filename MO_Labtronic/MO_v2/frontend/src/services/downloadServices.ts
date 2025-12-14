import {type ReturnMessage } from "@/types/systemMessage";
import { getFileLink } from "../lib/helperFunctions";

export function downloadFile(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined
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

export function downloadAllFiles(
  tableName: string | undefined,
  recordId: string | undefined,
  filesNames: string[] | undefined
) {
  if (!filesNames) return { success: false, msg: "Data missing", data: null };
  for (let i = 0; i < filesNames.length; i++) {
    setTimeout(() => {
      const res = downloadFile(tableName, recordId, filesNames[i]);
    }, 1000 * i);
  }
}
