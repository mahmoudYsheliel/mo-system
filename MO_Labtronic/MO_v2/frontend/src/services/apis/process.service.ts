import { type ProcessModel } from "@/models/process.model";
import { ApiService } from "../api.service";
import type { ReturnMessage } from "@/models/return-message.model";
import type { BatchResponseModel } from "@/models/batch-response.model";

const procEndPoint = "/api/collections/processes/records";

export async function batchUpdateProcesses(
  processes: ProcessModel[],
): Promise<ReturnMessage<BatchResponseModel[]>> {
  try {
    const batchEndPoint = "/api/batch";
    const requests = processes.map((proc) => {
      return {
        method: "PATCH",
        url: `${procEndPoint}/${proc.id}`,
        body: { status: proc.status },
      };
    });
    const batchRes = ApiService.post<BatchResponseModel[]>(batchEndPoint, {
      requests,
    });
    return batchRes;
  } catch (error) {
    console.error("Failed to update processes: ", error);
    throw error;
  }
}

export async function batchPostProcesses(
  processes: ProcessModel[],
): Promise<ReturnMessage<BatchResponseModel[]>> {
  try {
    const batchEndPoint = "/api/batch";
    const requests = processes.map((proc) => {
      return {
        method: "POST",
        url: procEndPoint,
        body: proc,
      };
    });
    const batchRes = ApiService.post<BatchResponseModel[]>(batchEndPoint, {
      requests,
    });
    return batchRes;
  } catch (error) {
    console.error("Failed to create processes: ", error);
    throw error;
  }
}
