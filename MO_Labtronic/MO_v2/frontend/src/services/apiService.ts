import { useAuth } from "@/stores/auth";
import { type ReturnMessage } from "@/types/systemMessage";
import { type ApiMethod } from "@/types/api";
import { ref } from "vue";


const auth = useAuth();

const _urlBase = "https://mo.lab-tronic.com/database";

export function getPocketBaseURL() {
  return _urlBase;
}

export function useApiHandler(urlBase=_urlBase) {
  const response = ref<ReturnMessage | null>(null);
  const isLoading = ref(true);

  async function apiHandle(
    urlPath: string,
    method: ApiMethod,
    authRequired: boolean = true,
    queryParams?: string,
    postParams?: Object,
    resTybe: 'blob' | 'data' = 'data'
  ) {
    isLoading.value = true;
    // await new Promise((resolve)=>{setTimeout(resolve,5000)})
    try {
      if (authRequired && !auth.token) {
        response.value = {
          success: false,
          msg: "Invalid credentials",
          data: null,
        };
        return response.value;
      }
      const urlFull = queryParams
        ? `${urlBase}${urlPath}${queryParams}`
        : `${urlBase}${urlPath}`;
      const headers = {
        "Content-Type": "application/json",
        ...(authRequired && auth.token && { Authorization: auth.token }),
      };
      const res = await fetch(urlFull, {
        method,
        headers,
        ...(postParams && { body: JSON.stringify(postParams) }),
      });
      if (!res.ok) {
        console.log(res)
        response.value = {
          success: false,
          msg: res?.statusText,
          data: null,
        };

        return response.value;
      }
      
      const data = resTybe==='data' ? await res.json() : await res.blob();
      response.value = { success: true, msg: "", data };
      return response.value;
    } catch (err: unknown) {
      response.value = {
        success: false,
        msg: err instanceof Error ? err.message : String(err),
        data: null,
      };
      return response.value;
    } finally {
      isLoading.value = false;
      return response.value;
    }
  }

  return { response, isLoading, apiHandle };
}
