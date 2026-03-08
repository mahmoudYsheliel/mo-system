import type { Priority } from "@/types/mo-order"
export interface ProjectModel {
    id?: string
    name?: string
    code?: string
    projectManagerId?: string
    designEngineersId?: string[]
    productionEngineersId?: string[]
    universityId?: string
    labId?: string
    assemblyPics?: string[]
    assemblyFiles?: string[]
    projectFiles?: string[]
    priority?: Priority
    finDeadline?: string
    estDeadline?: string
    created?: string
    updated?: string
    collectionId?: string
    collectionName?: string

}