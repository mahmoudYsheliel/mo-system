import { type PartModel } from "@/models/part.model";
import { ApiService } from "../api.service";
import type { ReturnMessage } from "@/models/return-message.model";

const partEndPoint = "/api/collections/parts/records";

export async function addPart(
  part: FormData,
): Promise<ReturnMessage<PartModel>> {
  try {
    const partRes = await ApiService.post<PartModel>(partEndPoint, part);
    return partRes;
  } catch (error) {
    console.error("Failed to create part", error);
    throw error;
  }
}
