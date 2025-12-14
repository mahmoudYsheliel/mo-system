import { fetchFileAsBlob } from "./fetchFileServices";
import { getFileLink } from "../lib/helperFunctions";
import {type FileNameUrl } from "@/types/moFile";
import {type ReturnMessage } from "@/types/systemMessage";
import { buildWhatsAppMessage } from "./whatsappMessageService";


export const fileShareFailMessage = "Permission denied";

export async function sendFileLink(
  tableName: string | undefined,
  recordId: string | undefined,
  fileName: string | undefined
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
  fileName: string | undefined
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
  recordId: string | undefined,
  fileName: string[] | undefined,
  projectName:string,
  MOName:string
): Promise<ReturnMessage> {
  if (!fileName) return { success:false,msg:'Files Names are undefined',data:null };
  const items: FileNameUrl[] = fileName
    .map((fn) => {
      const link = getFileLink(tableName, recordId, fn);
      return link ? { name: fn, url: link } : null;
    })
    .filter((item) => {
      return item != null;
    });

  const msg = buildWhatsAppMessage(projectName,MOName,items);


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
