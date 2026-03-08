export interface PartModel {
    id?: string
    name?: string
    code?: string
    moId?: string
    quantity?: string
    material?: string
    thickness?: string
    color?: string
    isApproved?: boolean
    pic?: any
    dim?: string
    created?: string
    updated?: string
    collectionId?: string
    collectionName?: string
}


export interface DBPartModel extends PartModel{
    processes?:string
}