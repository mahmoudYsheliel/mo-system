import { ApiService } from "../api.service";
import { type MONotificationModel } from "@/models/mo-notification.model";
import type { AccountModel } from "@/models/account.model";
import type { ReturnMessage } from "@/models/return-message.model";
import type { MOModel } from "@/models/mo.model";
import type { ListModel } from "@/models/list-model";
import { getUser } from "../user.service";
import {
  generateNotification,
  type NotificationEvent,
} from "@/lib/generate-notification";
import type { BatchResponseModel } from "@/models/batch-response.model";

const moNotificationEndPoint = "/api/collections/mo_notifications/records";

export interface ExpandedMONotification extends MONotificationModel {
  isRead?: boolean;
  expand?: {
    senderId?: AccountModel;
    receiversId?: AccountModel[];
    moId: MOModel;
  };
}

function computeNotificationDerivedProperties(
  notifications?: ExpandedMONotification[],
) {
  const userId = getUser()?.id;
  if (!userId || !notifications) return;

  notifications.forEach((notification) => {
    notification.isRead = notification.seenBy?.includes(userId) || false;
  });
}

const expansions = ["senderId", "receiversId", "moId"];

export async function createNotification(
  notificationEvent: NotificationEvent,
): Promise<ReturnMessage<MONotificationModel>> {
  try {
    const notification = generateNotification(notificationEvent);
    const notificationRes = await ApiService.post<MONotificationModel>(
      `${moNotificationEndPoint}`,
      notification,
    );
    return notificationRes;
  } catch (error) {
    console.error("Failed to add notification: ", error);
    throw error;
  }
}

export async function getUserNotification(): Promise<
  ReturnMessage<ListModel<ExpandedMONotification>>
> {
  try {
    const userId = getUser()?.id;
    const filter = `(receiversId ~ '${userId}')`;

    const notificationRes = await ApiService.get<
      ListModel<ExpandedMONotification>
    >(`${moNotificationEndPoint}`, {
      filter: filter,
      expand: expansions.join(","),
      sort: '-created'
    });

    computeNotificationDerivedProperties(notificationRes.data?.items);
    return notificationRes;
  } catch (error) {
    console.error("Failed to fetch notification: ", error);
    throw error;
  }
}

export async function markNotificationSeen(
  notification: MONotificationModel,
): Promise<ReturnMessage<MONotificationModel>> {
  try {
    const userId = getUser()?.id;
    if (userId && notification.seenBy && notification.seenBy.includes(userId)) {
      return {
        success: true,
        data: notification,
      };
    }
    const seenBy = notification.seenBy
      ? [...notification.seenBy, userId]
      : [userId];
    const moNotificationRes = await ApiService.patch<MONotificationModel>(
      `${moNotificationEndPoint}/${notification.id}`,
      { seenBy: JSON.stringify(seenBy) },
    );
    return moNotificationRes;
  } catch (error) {
    console.error("Failed to update MO data:", error);
    throw error;
  }
}




export async function batchMarkNotificationsRead(
): Promise<ReturnMessage<BatchResponseModel[]>> {
  try {
    const userId = getUser()?.id
    const notifications =  (await getUserNotification()).data?.items
    if (!notifications || !userId) return {
      success: false,
      msg: 'Failed to fetch user notifications'
    }
    const batchEndPoint = "/api/batch";
    const requests = notifications.map((notification) => {
      const seenBy = notification.seenBy ? [...notification.seenBy,userId] : [userId]
      return {
        method: "PATCH",
        url: `${moNotificationEndPoint}/${notification.id}`,
        body: {seenBy},
      };
    });
    const batchRes = ApiService.post<BatchResponseModel[]>(batchEndPoint, {
      requests,
    });
    return batchRes;
  } catch (error) {
    console.error("Failed to update notifications: ", error);
    throw error;
  }
}
