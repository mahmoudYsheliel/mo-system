import { type ProjectModel } from "@/models/project.model";
import { type ReturnMessage } from "@/models/return-message.model";
import { ApiService } from "../api.service";
import type { ListModel } from "@/models/list-model";
import type { AccountModel } from "@/models/account.model";
import type { ProjectCheckListModel } from "@/models/project-check-list.model";
import type { DeepExpandedMO, ExpandedNote } from "./mo.service";
import { computeMODerivedProperties } from "./mo.service";
import type { DeepExpandedLab } from "./lab.service";
import type { DeepExpandedUniversity } from "./university.service";

export interface DeepExpandedProject extends ProjectModel {
  expand?: {
    projectManagerId?: AccountModel;
    designEngineersId?: AccountModel[];
    productionEngineersId?: AccountModel[];
    universityId?: DeepExpandedUniversity;
    labId?: DeepExpandedLab;
    mos_via_projectId: DeepExpandedMO[];
    notes_via_projectId: ExpandedNote[];
    project_check_list_via_projectId: ProjectCheckListModel[];
  };
}

const projectEndPoint = "/api/collections/projects/records";

function computeProjectDerivedProperties(
  mos?: DeepExpandedMO[],
  project?: DeepExpandedProject,
) {
  if (!mos || !project) return;
  for (const mo of mos) {
    if (!mo.expand) mo.expand = {};
    mo.expand.projectId = project;
    computeMODerivedProperties(mo);
  }
}

const expansions = [
  "projectManagerId",
  "designEngineersId",
  "productionEngineersId",
  "universityId",
  "labId",
  "mos_via_projectId.seenBy",
  "mos_via_projectId.parts_via_moId.processes_via_partId",
  "mos_via_projectId.notes_via_moId",
  "mos_via_projectId.mo_files_via_moId",
  "notes_via_projectId.userId",
  "project_check_list_via_projectId",
];

export async function getExpandedProjects(): Promise<
  ReturnMessage<ListModel<DeepExpandedProject>>
> {
  try {
    const projectRes = await ApiService.get<ListModel<DeepExpandedProject>>(
      projectEndPoint,
      { expand: expansions.join(","), sort: "-created" },
    );
    projectRes.data?.items.forEach((project) =>
      computeProjectDerivedProperties(
        project.expand?.mos_via_projectId,
        project,
      ),
    );
    return projectRes;
  } catch (error) {
    console.error("Failed to fetch projects data:", error);
    throw error;
  }
}

export async function getExpandedProject(
  projectId: string,
): Promise<ReturnMessage<DeepExpandedProject>> {
  try {
    const projectRes = await ApiService.get<DeepExpandedProject>(
      `${projectEndPoint}/${projectId}`,
      { expand: expansions.join(","), sort: "-created" },
    );
    const project = projectRes.data;
    computeProjectDerivedProperties(
      project?.expand?.mos_via_projectId,
      project,
    );
    return projectRes;
  } catch (error) {
    console.error("Failed to fetch projects data:", error);
    throw error;
  }
}

export async function getProjects(): Promise<
  ReturnMessage<ListModel<ProjectModel>>
> {
  try {
    const projectRes = await ApiService.get<ListModel<ProjectModel>>(
      projectEndPoint,
      { sort: "-created" },
    );
    return projectRes;
  } catch (error) {
    console.error("Failed to fetch projects data:", error);
    throw error;
  }
}

export async function getProject(
  projectId: string,
): Promise<ReturnMessage<ProjectModel>> {
  try {
    const projectRes = await ApiService.get<ProjectModel>(
      `${projectEndPoint}/${projectId}`,
      { sort: "-created" },
    );
    return projectRes;
  } catch (error) {
    console.error("Failed to fetch projects data:", error);
    throw error;
  }
}

export async function createProject(
  project: FormData,
): Promise<ReturnMessage<ProjectModel>> {
  try {
    const projectRes = await ApiService.post<ProjectModel>(
      projectEndPoint,
      project,
    );
    return projectRes;
  } catch (error) {
    console.error("Failed to create project", error);
    throw error;
  }
}
