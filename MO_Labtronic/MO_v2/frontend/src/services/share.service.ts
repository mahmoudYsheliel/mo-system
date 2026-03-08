import { fetchFileAsBlob } from "./fetch-file.service";
import { getFileLink } from "../lib/helper-functions";
import { type FileNameUrlModel } from "@/models/file-name-url.model";
import { type ReturnMessage } from "@/models/return-message.model";
import { buildWhatsAppMessage } from "./whatsapp-message.service";
import type { ExpandedFile } from "./apis/mo.service";

export const fileShareFailMessage = "Permission denied";

export async function sendFileLink(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined,
): Promise<ReturnMessage> {
  const fileUrl = getFileLink(tableName, recordId, fileName);
  if (!fileUrl) return { success: false, msg: "Data missing", data: null };

  const shareData = {
    title: `File: ${fileName}`,
    url: fileUrl,
  };
  if (!("canShare" in navigator && "share" in navigator))
    return { success: false, msg: "Navigator does not exist", data: null };

  if (!navigator.canShare(shareData))
    return { success: false, msg: "Navigator can not share data", data: null };
  try {
    await navigator.share(shareData);
    return { success: true, msg: "Links sent successfully", data: null };
  } catch (error) {
    return {
      success: false,
      msg: "Navigator failed to share data" + error,
      data: null,
    };
  }
}

export async function shareFile(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined,
): Promise<ReturnMessage> {
  // test if canShare and share exist
  if (!("canShare" in navigator && "share" in navigator))
    return { success: false, msg: "Navigator does not exist", data: null };
  const res = await fetchFileAsBlob(tableName, recordId, fileName);

  // test if can send files
  if (
    !res.success ||
    !res.data?.fileBlob ||
    !navigator.canShare({ files: [res.data.fileBlob] })
  )
    return await sendFileLink(tableName, recordId, fileName);

  try {
    await navigator.share({
      title: `File: ${fileName}`,
      files: [res.data.fileBlob],
    });

    return { success: true, msg: "files sent successfully", data: null };
  } catch (error) {
    return { success: false, msg: (error as Error).message, data: null };
  }
}

export async function shareAllLinks(
  tableName: string | undefined,
  files: ExpandedFile[] | undefined,
  projectName: string,
  MOName: string,
): Promise<ReturnMessage> {
  if (!files)
    return { success: false, msg: "Files Names are undefined", data: null };
  const items: FileNameUrlModel[] = files
    .map((file) => {
      if (!file.file || !file.id) return null;
      const link = getFileLink(tableName, file.id, file.file);
      return link ? { name: file.file, url: link } : null;
    })
    .filter((item) => !!item);

  const msg = buildWhatsAppMessage(projectName, MOName, items);

  const shareData = {
    title: `Files Links`,
    text: msg,
  };
  if (!("canShare" in navigator && "share" in navigator))
    return { success: false, msg: "Navigator does not exist", data: null };

  if (!navigator.canShare(shareData))
    return { success: false, msg: "Navigator can not share data", data: null };
  try {
    await navigator.share(shareData);
    return { success: true, msg: "Links sent successfully", data: null };
  } catch (error) {
    return {
      success: false,
      msg: "Navigator failed to share data" + error,
      data: null,
    };
  }
}
