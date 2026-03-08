import { type UniversityModel } from "@/models/university.model";
import { type ReturnMessage } from "@/models/return-message.model";
import { ApiService } from "../api.service";
import type { ListModel } from "@/models/list-model";
import type { DeepExpandedProject } from "./project.service";

export interface DeepExpandedUniversity extends UniversityModel {
  expand?: {
    projects_via_universityId: DeepExpandedProject[];
  };
}

const universityEndPoint = "/api/collections/universities/records";

const expansions = [
  "projects_via_universityId.projectManagerId",
  "projects_via_universityId.designEngineersId",
  "projects_via_universityId.productionEngineersId",
  "projects_via_universityId.mos_via_projectId",
  "projects_via_universityId.universityId",
  "projects_via_universityId.labId.projects_via_labId",
];
export async function getUniversities(): Promise<
  ReturnMessage<ListModel<DeepExpandedUniversity>>
> {
  try {
    const universityRes = await ApiService.get<
      ListModel<DeepExpandedUniversity>
    >(universityEndPoint, { expand: expansions.join(","),sort:'-created' });
    return universityRes;
  } catch (error) {
    console.error("Failed to fetch universities data:", error);
    throw error;
  }
}

export async function getUniversity(
  universityId: string,
): Promise<ReturnMessage<DeepExpandedUniversity>> {
  try {
    const universityRes = await ApiService.get<DeepExpandedUniversity>(
      `${universityEndPoint}/${universityId}`,
      { expand: expansions.join(","),sort:'-created' },
    );
    return universityRes;
  } catch (error) {
    console.error("Failed to fetch universities data:", error);
    throw error;
  }
}

export async function createUniversity(
  university: UniversityModel,
): Promise<ReturnMessage<UniversityModel>> {
  try {
    const universityRes = await ApiService.post<UniversityModel>(
      universityEndPoint,
      university,
    );
    return universityRes;
  } catch (error) {
    console.error("Failed to create university", error);
    throw error;
  }
}
