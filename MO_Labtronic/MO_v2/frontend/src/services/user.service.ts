import { type ReturnMessage } from "@/models/return-message.model";
import type { AccountModel } from "@/models/account.model";
import { type AuthWithPassModel } from "@/models/auth-with-pass.model";
import { ApiService } from "@/services/api.service";
import { checkSubscriberId } from "./apis/account.service";

const loginEndPoint = "/api/collections/accounts/auth-with-password";


export function setToken(newToken: string | null) {
  if (newToken) localStorage.setItem("token", newToken);
  else localStorage.removeItem("token");
}
export function getToken(): string | null {
  return localStorage.getItem("token");
}
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}


export function setUser(user: AccountModel | null | undefined) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}
export function getUser(): AccountModel | null {
  const userLocalStorage = localStorage.getItem("user");
  return userLocalStorage ? JSON.parse(userLocalStorage) : null;
}


export function setPushAlertSubscriberId(pushAlertSubscriberId: string | null | undefined) {
  if (pushAlertSubscriberId) localStorage.setItem("pushAlertSubscriberId", JSON.stringify(pushAlertSubscriberId));
  else localStorage.removeItem("pushAlertSubscriberId");
}
export function getPushAlertSubscriberId(): string | null {
  const pushAlertSubscriberIdLocalStorage = localStorage.getItem("pushAlertSubscriberId");
  return pushAlertSubscriberIdLocalStorage ? JSON.parse(pushAlertSubscriberIdLocalStorage) : null;
}


export async function login(
  email: string,
  pass: string,
): Promise<ReturnMessage> {
  try {
    const res = await ApiService.post<AuthWithPassModel>(loginEndPoint, {
      identity: email,
      password: pass,
    });

    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.record);
      const pushAlertSubscriberId = getPushAlertSubscriberId()
      if(pushAlertSubscriberId) checkSubscriberId(pushAlertSubscriberId)
    }
    return res;
  } catch (err: unknown) {
    return {
      success: false,
      msg: err instanceof Error ? err.message : String(err),
      data: null,
    };
  }
}

export function logout() {
  setToken(null);
  setUser(null);
  window.location.reload();
}


