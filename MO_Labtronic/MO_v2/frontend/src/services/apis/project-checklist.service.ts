import { type ProjectCheckListModel } from "@/models/project-check-list.model";
import { ApiService } from "../api.service";
import type { ReturnMessage } from "@/models/return-message.model";
import type { BatchResponseModel } from "@/models/batch-response.model";

const projectChecklistEndPoint = "/api/collections/project_check_list/records";

export async function batchUpdateCheckList(
  checkList: ProjectCheckListModel[],
): Promise<ReturnMessage<BatchResponseModel[]>> {
  try {
    const batchEndPoint = "/api/batch";
    const requests = checkList.map((checkItem) => {
      return {
        method: "PATCH",
        url: `${projectChecklistEndPoint}/${checkItem.id}`,
        body: checkItem,
      };
    });
    const batchRes = ApiService.post<BatchResponseModel[]>(batchEndPoint, {
      requests,
    });
    return batchRes;
  } catch (error) {
    console.error("Failed to update checks: ", error);
    throw error;
  }
}
