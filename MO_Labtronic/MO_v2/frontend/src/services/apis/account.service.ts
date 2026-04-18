import { type AccountModel } from "@/models/account.model";
import { ApiService } from "../api.service";
import type { ReturnMessage } from "@/models/return-message.model";
import type { ListModel } from "@/models/list-model";
import type { UpdatePasswordModel } from "@/models/update-password.model";
import { getUser, setUser } from "../user.service";
import type { SearchCriteriaModel } from "@/models/search-criteria.model";

export const accountEndPoint = "/api/collections/accounts/records";

export async function getUsers(searchCriteria?:SearchCriteriaModel): Promise<
  ReturnMessage<ListModel<AccountModel>>
> {
  try {
    const accRes =
      await ApiService.get<ListModel<AccountModel>>(accountEndPoint,searchCriteria);
    return accRes;
  } catch (error) {
    console.error("Failed to get accounts data:", error);
    throw error;
  }
}

export async function updateUserAvatar(
  userId: string,
  formData: FormData,
): Promise<ReturnMessage<AccountModel>> {
  try {
    const accRes = await ApiService.patch<AccountModel>(
      `${accountEndPoint}/${userId}`,
      formData,
    );
    return accRes;
  } catch (error) {
    console.error("Failed to update account avatar:", error);
    throw error;
  }
}

export async function updatePasswordApi(
  userId: string,
  updatePassword: UpdatePasswordModel,
): Promise<ReturnMessage<AccountModel>> {
  try {
    const accRes = await ApiService.patch<AccountModel>(
      `${accountEndPoint}/${userId}`,
      updatePassword,
    );
    return accRes;
  } catch (error) {
    console.error("Failed to update account password:", error);
    throw error;
  }
}



export async function checkSubscriberId(subscriberId: string): Promise<ReturnMessage<AccountModel>> {
  try {
    const currentUser = getUser()
    if (!currentUser?.id) return {
      success: false,
      msg:'User not loged in' 
    }

    if (subscriberId == currentUser?.pushAlertSubscriberId) return {
      success: true,
      data: currentUser
    }
   
    const accRes = await ApiService.patch<AccountModel>(`${accountEndPoint}/${currentUser?.id}`, {
      pushAlertSubscriberId: subscriberId
    });
    setUser(accRes.data)
    return accRes;
  } catch (error) {
    console.error("Failed to get deep MO data:", error);
    throw error;
  }
}