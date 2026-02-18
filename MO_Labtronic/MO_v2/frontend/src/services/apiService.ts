import { useAuth } from "@/stores/auth";
import { type ReturnMessage } from "@/types/systemMessage";
import { type ApiMethod } from "@/types/api";
import { ref } from "vue";


const auth = useAuth();

const _urlBase = "https://mo.lab-tronic.com/database";

export function getPocketBaseURL() {
  return _urlBase;
}

export async function apiHandle(
  urlPath: string,
  method: ApiMethod,
  authRequired: boolean = true,
  queryParams?: string,
  postParams?: Object | FormData,
  resTybe: 'blob' | 'data' = 'data', // typo fix: resType
  bodyType: 'object' | 'form_data' = 'object',
  headerContentType: string | null = "application/json",
  urlBase = _urlBase
) {
  try {
    const headers: Record<string, string> = {};

    if (authRequired && auth.token) {
      headers['Authorization'] = auth.token;
    }

    if (headerContentType) {
      headers['Content-Type'] = headerContentType;
    }

    let body: any = undefined;
    if (postParams) {
      if (bodyType === 'object') {
        body = JSON.stringify(postParams);
      } else if (bodyType === 'form_data') {
        body = postParams;
      }
    }

    const urlFull = queryParams
      ? `${urlBase}${urlPath}${queryParams}`
      : `${urlBase}${urlPath}`;

    // 2. Pass headers unconditionally
    const res = await fetch(urlFull, {
      method,
      headers,
      body,
    });
    

    if (!res.ok) {
      const data = await res.json()
      
      return {
        success: false,
        msg: res.statusText,
        data,
      };
    }
    const data = resTybe === 'data' ? await res.json() : await res.blob();
    return { success: true, msg: "", data };
  } catch (err: unknown) {
    return {
      success: false,
      msg: err instanceof Error ? err.message : String(err),
      data: err,
    };
  }
}