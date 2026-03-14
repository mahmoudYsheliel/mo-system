

import { type MONotificationModel } from "@/models/mo-notification.model";
import type { NotificationType } from "@/types/notifications";
import { getUsers } from "./account.service";


const PUSHALERT_API_URL = "http://127.0.0.1:3000/api/notify";
const WEBSITE_URL = 'dev.mo.lab-tronic'

export async function sendPushAlertNotification(
    notification: MONotificationModel
): Promise<any> {

    if (!notification?.receiversId || notification?.receiversId?.length === 0) {
        console.warn("PushAlert: No receivers found for this notification.");
        return null;
    }
    const usersPushalertIds = await getUsersPushalertIds(notification.receiversId)

    const title = notification.title || getDefaultTitle(notification.type);
    const message = notification.body || "You have a new update in the system.";

    const targetUrl = notification.moId
        ? `https://${WEBSITE_URL}.com/manufacturing-order-info/${notification.moId}`
        : `https://${WEBSITE_URL}.com/dashboard`;

    const body = {
        title, message, url: targetUrl, subscribers: JSON.stringify(usersPushalertIds)
    }

    try {
        const response = await fetch(PUSHALERT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("PushAlert API Error:", data);
            throw new Error(data.message || "Failed to send push notification");
        }

        console.log("PushAlert notification sent successfully!", data);
        return data;

    } catch (error) {
        console.error("Failed to execute sendPushAlertNotification:", error);
        throw error;
    }
}

async function getUsersPushalertIds(userIds: string[] | string | undefined | null): Promise<string[]> {
    if (!userIds) return []

    const usersRes = await getUsers()
    if (!usersRes.data?.items) return []

    const users = usersRes.data.items
    // if userIds is string, make it string[]
    if (!Array.isArray(userIds)) userIds = [userIds]

    const usersPushalertIds: string[] = []
    for (const userId of userIds) {
        const mappedId = users.find(user => user.id === userId)?.pushAlertSubscriberId
        if (mappedId) usersPushalertIds.push(mappedId)
    }
    return usersPushalertIds

}

function getDefaultTitle(type?: NotificationType): string {
    switch (type) {
        case "mo_created": return "New Order Created";
        case "mo_edited": return "Order Updated";
        case "mo_completed": return "Order Completed";
        case "mo_note": return "New Note Added";
        case "process_rejected": return "Process Rejected";
        default: return "New System Notification";
    }
}









async function sendNotification (body:any) {
    const apiKey = '258fce9f345a0588f5962c9b52f096cc';
    const frontendPayload = body;

    const params = new URLSearchParams();
    
    for (const key in frontendPayload) {
        if (Array.isArray(frontendPayload[key]) || typeof frontendPayload[key] === 'object') {
            params.append(key, JSON.stringify(frontendPayload[key]));
        } else {
            params.append(key, frontendPayload[key]);
        }
    }

    try {
        const pushResponse = await fetch("https://api.pushalert.co/rest/v1/send", {
            method: "POST",
            headers: {
                "Authorization": `api_key=${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });

        const data = await pushResponse.json();
        console.log(data)
    } catch (error:any) {
        console.error("Proxy forwarding failed:", error.message);
    }
}