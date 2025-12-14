import { getFileLink } from "../lib/helperFunctions";
import {type ReturnMessage } from "@/types/systemMessage";

export async function fetchFileAsBlob(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined
): Promise<ReturnMessage> {
  const fileUrl = getFileLink(tableName, recordId, fileName);
  if (!(fileUrl && fileName))
    return { success: false, msg: "Data missing", data: null };
  try {
    const response = await fetch(fileUrl);
    if (response.ok) {
      const blob = await response.blob();
      const fileBlob = new File([blob], fileName, {
        type: blob.type || "application/octet-stream",
      });
      const d = await fileBlob.arrayBuffer()
      return { success: true, msg: "", data: { fileBlob } };
    } else {
      return {
        success: false,
        msg: `Failed to fetch file ${fileName}: HTTP ${response.status}`,
        data: null,
      };
    }
  } catch (error) {
    return {
      success: false,
      msg: `Failed to fetch file ${fileName}: ${error}`,
      data: null,
    };
  }
}
