import { getToken, isTokenValid, logout } from "./user.service";
import { type ApiOptions } from "@/types/api-options";
import {
  type PbErrorResponse,
  type ReturnMessage,
} from "@/models/return-message.model";

const _urlBase = "https://mo.lab-tronic.com/database";

export function getPocketBaseURL() {
  return _urlBase;
}

export class ApiService {
  private static baseUrl = _urlBase;

  private static async request<T>(
    options: ApiOptions,
  ): Promise<ReturnMessage<T>> {
    const {
      url,
      method = "GET",
      data,
      params,
      auth = true,
      responseType = "json",
      headers: customHeaders,
    } = options;
    try {
      const fullUrl = new URL(`${this.baseUrl}${url}`);
      if (params) {
        Object.keys(params).forEach((key) =>
          fullUrl.searchParams.append(key, String(params[key])),
        );
      }
      const headers = new Headers(customHeaders);
      if (auth) {
        const token = getToken();
        if (token && !isTokenValid(token)) { // if auth required and there is an invalid token, we need to log in 
          logout();
        }
        if (token) headers.set("Authorization", token);
      }
      let body: any = undefined;
      if (data && !["GET", "DELETE"].includes(method)) {
        if (data instanceof FormData) {
          body = data;
        } else {
          body = JSON.stringify(data);
          headers.set("Content-Type", "application/json");
        }
      }
      const response = await fetch(fullUrl.toString(), {
        method,
        headers,
        body,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          msg:
            errorData.message ||
            `Error ${response.status}: ${response.statusText}`,
          error: errorData,
        };
      }

      if (response.status === 204)
        return { success: true, msg: "", data: {} as T };

      const result =
        responseType === "blob" ? await response.blob() : await response.json();

      return { success: true, msg: "", data: result };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : "Network Request Failed",
      };
    }
  }
  static get<T>(url: string, params?: any) {
    return this.request<T>({ url, method: "GET", params });
  }
  static post<T>(url: string, data: any) {
    return this.request<T>({ url, method: "POST", data });
  }
  static delete<T>(url: string) {
    return this.request<T>({ url, method: "DELETE" });
  }
  static patch<T>(url: string, data: any) {
    return this.request<T>({ url, method: "PATCH", data });
  }
}
