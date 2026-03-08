import type { PartStatus } from "@/types/part"
export interface ProcessModel {
    id?: string
    name?: string
    status?: PartStatus
    order?: number
    partId?: string
    created?: string
    updated?: string
    collectionId?: string
    collectionName?: string
}