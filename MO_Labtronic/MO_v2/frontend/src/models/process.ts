import type{ PartStatus } from "@/types/part"
export interface Process{
    id?:string
    name?:string
    status?:PartStatus
    order?:number
    partId?:string
    created?:Date
    updated?:Date
}