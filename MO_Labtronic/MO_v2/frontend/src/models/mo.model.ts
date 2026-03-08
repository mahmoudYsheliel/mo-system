import type { Priority } from "@/types/mo-order";

export interface MOModel {
  id?: string;
  name?: string;
  type?: string;
  priority?: Priority;
  projectId?: string;
  seenBy?: string[];
  productionEngineer?: string;
  estDeadline?: string;
  finDeadline?: string;
  created?: string;
  updated?: string;
  collectionId?: string;
  collectionName?: string;
}
