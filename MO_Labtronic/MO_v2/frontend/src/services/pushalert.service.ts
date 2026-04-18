import { getUser } from "./user.service";
import { ApiService } from "./api.service";
import { type AccountModel } from "@/models/account.model";
import type { ReturnMessage } from "@/models/return-message.model";
import { accountEndPoint } from "./apis/account.service";
import type { PushalertOnSuccessModel } from "@/models/pushalert-onsuccess.model";


export function subscribeToPushAlert(func?: (input: ReturnMessage<AccountModel>) => any) {
    if((!window as any).pushalertbyiw) return
    (window as any).pushalertbyiw.push(['onSuccess', function (result: any) {
        const res = result as PushalertOnSuccessModel
        if (!res.alreadySubscribed) {
            checkSubscriberId(res.subscriber_id).then(res => { if (func) func(res) })
            console.log({ res })
        }
    }]);
}

async function checkSubscriberId(subscriberId: string): Promise<ReturnMessage<AccountModel>> {
    try {
        const currentUser = getUser()
        if (subscriberId == currentUser?.pushAlertSubscriberId) return {
            success: true,
            data: currentUser
        }

        const accRes = await ApiService.patch<AccountModel>(`${accountEndPoint}/${currentUser?.id}`, {
            pushAlertSubscriberId: subscriberId
        });
        return accRes;
    } catch (error) {
        console.error("Failed to get deep MO data:", error);
        throw error;
    }

}