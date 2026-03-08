export interface ListModel<T=any>{
    page:number,
    perPage:number,
    totalPages:number,
    totalItems:number,
    items:T[]
}