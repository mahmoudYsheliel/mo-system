import type { Notification } from "@/types/notifications";
import { useApiHandler } from "./apiService";
import { useAuth } from "@/stores/auth";

const BACKEN_API = "http://localhost:3000";

export async function getVapId() {
  return await fetch(`${BACKEN_API}/vapid_key`).then((res) => res.text());
}

export async function getSubscriptionKey(userId:string) {
  const { apiHandle, isLoading, response } = useApiHandler();
  await apiHandle(
    "/api/collections/users_subscriptions/records",
    "GET",
    true,
    `?filter=(user='${userId}')`
  );
  return response.value;
}

export async function requestNotificationPermission():Promise<boolean>{
 if (!navigator.serviceWorker) return false;
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission != "granted") return false;
  }
  return true
}


export async function loadServiceWorker():Promise<ServiceWorkerRegistration>{
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return registration
}
export async function  checkSubscription(registration:ServiceWorkerRegistration):Promise<PushSubscription | null> {
  const subscription = await registration.pushManager.getSubscription()
  return subscription
}


export async function initSubscription(registration:ServiceWorkerRegistration,key:string): Promise<PushSubscription> {
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  return sub
}
export async function postSub(user: string, subscription: any) {
  const { apiHandle, isLoading, response } = useApiHandler();
  await apiHandle("/users_subscriptions", "POST", true, undefined, {
    subscription,
    user,
  });
  return( response.value && response.value.success) || false;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

export async function sendNotification(
  title: string,
  body: string,
  type: Notification,
  navigation_url: string,
  extera_data: any,
  sender: string,
  receiver: string
) {
  const { apiHandle, isLoading, response } = useApiHandler(BACKEN_API);
  const is_read = false;
  const params = {
    sender,
    receiver,
    title,
    body,
    type,
    navigation_url,
    is_read,
    extera_data,
  };
  await apiHandle("/notify", "POST", false, undefined, params);
  return response;
}

export function showNotification(){
  
}