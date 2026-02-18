import type { Priority } from "@/types/mo-order"

export interface MO{
    id?:string
    name?:string
    type?:string
    priority?:Priority
    projectId?:string
    seenBy?:string[]
    productionEngineer?:string
    estDealine?:Date
    finDealine?:Date
    created?:Date
    updated?:Date
}