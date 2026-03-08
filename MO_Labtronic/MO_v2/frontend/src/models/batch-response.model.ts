export interface BatchResponseModel<T = any>{
    status:number
    body: T
}