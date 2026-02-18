import type{ Priority } from "@/types/mo-order"
export interface Project {
    id?:string
    name?:string
    code?:string
    projectManagerId?:string
    designEngineersId?:string
    productionEngineersId?:string
    universityId?:string
    labID?:string
    assemblyPics?:string[]
    assemblyFiles?:string[]
    projectFiles?:string[]
    priority?:Priority
    finDeadline?:Date
    estDeadline?:Date
    created?:Date
    updated?:Date
    
}