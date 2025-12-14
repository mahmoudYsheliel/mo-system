import { defineStore } from "pinia";
import { useAuth } from "../stores/auth";
import * as notif from "@/services/notification";
import type { Subscription } from "@/types/subscription";

export const useSubscriptionToken = defineStore("subscriptionToken", () => {
  const userId = useAuth().user.id;
  let isSavedSubscription: boolean | null = null;

  async function checkSubscription(): Promise<boolean> {
    try {
      // check notification permission
      const hasPermission = await notif.requestNotificationPermission();
      if (!hasPermission) return false;
      // check old subscription
      const registration = await notif.loadServiceWorker();
      const oldSubscription = await notif.checkSubscription(registration);
      // if no old subscription => generate and save
      if (!oldSubscription) {
        const key = await notif.getVapId();
        const sub = await notif.initSubscription(registration, key);
        return await notif.postSub(userId, sub);
      }

      // check db for old notifications
      const dbSubscriptions = await notif.getSubscriptionKey(userId);

      if (dbSubscriptions && dbSubscriptions.success) {
        const subs = dbSubscriptions.data?.items as Subscription[];
        // check if old notification exist in db
        for (const sub of subs) {
          if (oldSubscription.endpoint == sub.endpoint) {
            return true;
          }
        }
      }
      // generate new notification object and send to the db
      const key = await notif.getVapId();
      const sub = await notif.initSubscription(registration, key);
      return await notif.postSub(userId, sub);
    } catch (error) {
      console.log(error)
      return false;
    }
  }
  async function checkSaveSubscription(): Promise<boolean> {
    if (isSavedSubscription !== null) return isSavedSubscription;

    const _hasSubscription = await checkSubscription();
    isSavedSubscription = _hasSubscription;
    return _hasSubscription;
  }

  return { checkSaveSubscription };
});
