import { type LabModel } from "@/models/lab.model";
import { type ReturnMessage } from "@/models/return-message.model";
import { ApiService } from "../api.service";
import type { ListModel } from "@/models/list-model";
import type { DeepExpandedProject } from "./project.service";

export interface DeepExpandedLab extends LabModel {
  expand?: {
    projects_via_labId: DeepExpandedProject[];
  };
}

const labEndPoint = "/api/collections/labs/records";

const expansions = [
  "projects_via_labId.projectManagerId",
  "projects_via_labId.designEngineersId",
  "projects_via_labId.productionEngineersId",
  "projects_via_labId.mos_via_projectId",
  "projects_via_labId.labId",
  "projects_via_labId.universityId.projects_via_universityId",
];
export async function getLabs(): Promise<
  ReturnMessage<ListModel<DeepExpandedLab>>
> {
  try {
    const labRes = await ApiService.get<ListModel<DeepExpandedLab>>(
      labEndPoint,
      { expand: expansions.join(","),sort:'-created' },
    );
    return labRes;
  } catch (error) {
    console.error("Failed to fetch labs data:", error);
    throw error;
  }
}

export async function getLab(
  labId: string,
): Promise<ReturnMessage<DeepExpandedLab>> {
  try {
    const labRes = await ApiService.get<DeepExpandedLab>(
      `${labEndPoint}/${labId}`,
      { expand: expansions.join(","),sort:'-created' },
    );
    return labRes;
  } catch (error) {
    console.error("Failed to fetch labs data:", error);
    throw error;
  }
}

export async function createLab(
  lab: LabModel,
): Promise<ReturnMessage<LabModel>> {
  try {
    const labRes = await ApiService.post<LabModel>(labEndPoint, lab);
    return labRes;
  } catch (error) {
    console.error("Failed to create lab", error);
    throw error;
  }
}
