import { type MOFileModel } from "@/models/mo-file.model";
import { type ReturnMessage } from "@/models/return-message.model";
import { ApiService } from "../api.service";

const moFileEndPoint = "/api/collections/mo_files/records";

export async function updateMOFile(
  fileId: string,
  file: MOFileModel,
): Promise<ReturnMessage<MOFileModel>> {
  try {
    const fileRes = await ApiService.patch<MOFileModel>(
      `${moFileEndPoint}/${fileId}`,
      file,
    );
    return fileRes;
  } catch (error) {
    console.error("Failed to update file data:", error);
    throw error;
  }
}
