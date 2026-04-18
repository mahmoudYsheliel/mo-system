import type { SearchCriteriaModel } from "@/models/search-criteria.model";
import { type ApiMethod } from "@/types/api";
export interface ApiOptions {
    url: string;
    method?: ApiMethod;
    data?: any;
    params?: SearchCriteriaModel
    auth?: boolean;
    abortKey?:string
}