import { type DeepExpandedMO } from "@/services/apis/mo.service";
import { type NotificationType } from "@/types/notifications";
import { type MONotificationModel } from "@/models/mo-notification.model";
import { getUser } from "@/services/user.service";
import type { NoteModel } from "@/models/note.model";

export interface NotificationEvent {
  mo: DeepExpandedMO;
  notificationType: NotificationType;
  addedNote?: string;
}
export function generateNotification(
  notificationEvent: NotificationEvent,
): MONotificationModel {
  const { mo, notificationType, addedNote } = notificationEvent;
  const userId = getUser()?.id;
  const moId = mo.id;
  const allReceiversId = [
    ...(mo.expand?.projectId?.productionEngineersId ?? []),
    ...(mo.expand?.projectId?.designEngineersId ?? []),
    mo.expand?.projectId?.projectManagerId,
  ];
  const receiversId = allReceiversId.filter(
    (id): id is string => typeof id === "string" && id.trim() !== "",
  );
  const notification: MONotificationModel = {
    moId,
    type: notificationType,
    seenBy: [],
    senderId: userId,
    receiversId,
  };

  switch (notificationType) {
    case "mo_edited":
      notification.title = `MO Updated: ${mo.name}`;
      notification.body = `Changes have been made to this order. Please check the latest updates.`;
      break;

    case "mo_created":
      notification.title = `New MO Assigned: ${mo.name}`;
      notification.body = `A new order has been created in ${mo.expand?.projectId?.name}. Please review the details.`;
      break;

    case "mo_completed":
      notification.title = `MO Completed: ${mo.name}`;
      notification.body = `All tasks for this order have been successfully finished.`;
      break;

    case "mo_note":
      notification.title = `New Note on: ${mo.name}`;
      notification.body = `${addedNote}`;
      break;

    case "process_rejected":
      notification.title = `Action Required: Part Rejected in ${mo.name}`;
      notification.body = `A part has been rejected. Please review and resolve the issue.`;
      break;
  }

  return notification;
}
