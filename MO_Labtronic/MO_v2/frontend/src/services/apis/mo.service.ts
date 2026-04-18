import { type MOModel } from "@/models/mo.model";
import { type AccountModel } from "@/models/account.model";
import { type ProjectModel } from "@/models/project.model";
import { type PartModel } from "@/models/part.model";
import { type ProcessModel } from "@/models/process.model";
import { type ListModel } from "@/models/list-model";
import { type ReturnMessage } from "@/models/return-message.model";
import { type MOStatus } from "@/types/mo-order";
import { type NoteModel } from "@/models/note.model";
import { type MOFileModel } from "@/models/mo-file.model";
import { type UniversityModel } from "@/models/university.model";
import { type LabModel } from "@/models/lab.model";
import { ApiService } from "../api.service";
import { getUser } from "../user.service";
import { SearchCriteriaModel } from "@/models/search-criteria.model";

export interface ExpandedPart extends PartModel {
  expand?: {
    processes_via_partId?: ProcessModel[];
  };
}
export interface ExpandedProject extends ProjectModel {
  expand?: {
    projectManagerId?: AccountModel;
    designEngineersId?: AccountModel[];
    productionEngineersId?: AccountModel[];
    universityId?: UniversityModel;
    labId?: LabModel;
  };
}
export interface ExpandedNote extends NoteModel {
  expand?: {
    userId?: AccountModel;
  };
}
export interface ExpandedFile extends MOFileModel {
  expand?: {
    senderId?: AccountModel;
  };
}

export interface DeepExpandedMO extends MOModel {
  status?: MOStatus;
  completionPercentage?: number;
  isAllFilesSent?: boolean;
  expand?: {
    notes_via_moId?: NoteModel[];
    mo_files_via_moId?: ExpandedFile[];
    projectId?: ExpandedProject;
    productionEngineer?: AccountModel;
    seenBy?: AccountModel[];
    parts_via_moId?: ExpandedPart[];
  };
}

const moEndPoint = "/api/collections/mos/records";

export function computeMODerivedProperties(mo?: DeepExpandedMO) {
  if (!mo) return;
  mo.isAllFilesSent = !mo.expand?.mo_files_via_moId?.some(
    (file) => !!!file.senderId,
  );
  const moParts = mo.expand?.parts_via_moId;
  if (!moParts) {
    mo.status = "Completed";
    mo.completionPercentage = 100;
    return;
  }
  moParts.forEach((part) => {
    if (!part.color) part.color = "No Color";
  });
  const allProcesses = moParts.flatMap(
    (part) => part.expand?.processes_via_partId || [],
  );
  const totalProcesses = allProcesses.length;
  const procFinished = allProcesses.filter(
    (proc) => proc.status == "Done",
  ).length;
  mo.completionPercentage =
    totalProcesses !== 0
      ? Math.round((procFinished / totalProcesses) * 100)
      : 100;
  switch (mo.completionPercentage) {
    case 0:
      mo.status = "Not Started";
      break;
    case 100:
      mo.status = "Completed";
      break;
    default:
      mo.status = "Active";
      break;
  }
}
const expansions = [
  "projectId.projectManagerId",
  "projectId.designEngineersId",
  "projectId.productionEngineersId",
  "projectId.universityId",
  "projectId.labId",
  "seenBy",
  "productionEngineer",
  "parts_via_moId.processes_via_partId",
  "notes_via_moId.userId",
  "mo_files_via_moId.senderId",
];

export async function getMyMOs(searchCriteria?:SearchCriteriaModel): Promise<
  ReturnMessage<ListModel<DeepExpandedMO>>
> {

  try {
    const userId = getUser()?.id;
    if(!userId) throw Error('User Id undefined')
    const mosRes = await ApiService.get<ListModel<DeepExpandedMO>>(moEndPoint, new SearchCriteriaModel({
      ...searchCriteria,
      expand: expansions,
      filter:[
        {field:'projectId.projectManagerId',criteria:'contains',value:userId},
        {field:'projectId.designEngineersId',criteria:'contains',value:userId},
        {field:'projectId.productionEngineersId',criteria:'contains',value:userId}
      ],
      filterJoinMethod:'||',
      

    }),'moRequest');
    mosRes.data?.items.forEach((mo) => computeMODerivedProperties(mo));
    return mosRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}

export async function getMOs(searchCriteria?:SearchCriteriaModel): Promise<
  ReturnMessage<ListModel<DeepExpandedMO>>
> {
  try {
    const mosRes = await ApiService.get<ListModel<DeepExpandedMO>>(moEndPoint, new SearchCriteriaModel({
      ...searchCriteria,expand: expansions,
    }),'moRequest');
    mosRes.data?.items.forEach((mo) => computeMODerivedProperties(mo));
    return mosRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}

export async function getMO(
  moId: string,
): Promise<ReturnMessage<DeepExpandedMO>> {
  try {
    const moRes = await ApiService.get<DeepExpandedMO>(
      `${moEndPoint}/${moId}`,
      new SearchCriteriaModel({ expand: expansions})
    );
    computeMODerivedProperties(moRes.data);
    return moRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}

export async function setMoProdEng(
  moId: string,
  engId: string,
): Promise<ReturnMessage<MOModel>> {
  try {
    const moRes = await ApiService.patch<MOModel>(`${moEndPoint}/${moId}`, {
      productionEngineer: engId,
    });
    computeMODerivedProperties(moRes.data);
    return moRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}

export async function setEstDate(
  moId: string,
  estDeadline: string,
): Promise<ReturnMessage<MOModel>> {
  try {
    const moRes = await ApiService.patch<MOModel>(`${moEndPoint}/${moId}`, {
      estDeadline,
    });
    computeMODerivedProperties(moRes.data);
    return moRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}

export async function addMO(mo: MOModel): Promise<ReturnMessage<MOModel>> {
  try {
    const moRes = await ApiService.post<MOModel>(moEndPoint, mo);
    return moRes;
  } catch (error) {
    console.error("Failed to add  MO data:", error);
    throw error;
  }
}

export async function markMoSeen(mo: MOModel): Promise<ReturnMessage<MOModel>> {
  try {
    const userId = getUser()?.id;
    if (userId && mo.seenBy && mo.seenBy.includes(userId)) {
      return {
        success: true,
        data: mo,
      };
    }
    const seenBy = mo.seenBy ? [...mo.seenBy, userId] : [userId];
    const moRes = await ApiService.patch<MOModel>(`${moEndPoint}/${mo.id}`, {
      seenBy: JSON.stringify(seenBy),
    });
    return moRes;
  } catch (error) {
    console.error("Failed to update MO data:", error);
    throw error;
  }
}
