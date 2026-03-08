import type { AccountModel } from "./account.model";

export interface AuthWithPassModel {
  token: string;
  record: AccountModel;
}
