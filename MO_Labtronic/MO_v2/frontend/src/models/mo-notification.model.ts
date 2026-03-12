import type { NotificationType } from "@/types/notifications";

export interface MONotificationModel {
  id?: string;
  moId?: string;
  title?: string;
  body?: string;
  type?:NotificationType
  receiversId?: string[];
  seenBy?: string[];
  senderId?: string;
  created?: string;
  updated?: string;
  collectionId?: string;
  collectionName?: string;
}
