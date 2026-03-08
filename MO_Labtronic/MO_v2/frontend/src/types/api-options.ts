import { type ApiMethod } from "@/types/api";
export interface ApiOptions {
    url: string;
    method?: ApiMethod;
    data?: any;
    params?: Record<string, string | number>; // URL Query Params
    auth?: boolean;
    responseType?: 'json' | 'blob';
    headers?: Record<string, string>;
}