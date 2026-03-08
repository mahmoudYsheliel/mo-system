import { type AccountModel } from "@/models/account.model";
import { ApiService } from "../api.service";
import type { ReturnMessage } from "@/models/return-message.model";
import type { ListModel } from "@/models/list-model";
import type { UpdatePasswordModel } from "@/models/update-password.model";

const accountEndPoint = "/api/collections/accounts/records";

export async function getUsers(): Promise<
  ReturnMessage<ListModel<AccountModel>>
> {
  try {
    const accRes =
      await ApiService.get<ListModel<AccountModel>>(accountEndPoint);
    return accRes;
  } catch (error) {
    console.error("Failed to fetch accounts data:", error);
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
