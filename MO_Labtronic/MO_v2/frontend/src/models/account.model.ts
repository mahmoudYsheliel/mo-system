import type { UserType } from "@/types/user"

export interface AccountModel {
    id?: string
    oldPassword?: string,
    passwordConfirm?: string,
    password?: string,
    tokenKey?: string
    pushAlertSubscriberId?: string
    email?: string
    emailVisibility?: string
    userName?: string
    fullName?: string
    roles?: UserType[]
    avatar?: string
    created?: string
    updated?: string
    collectionId?: string
    collectionName?: string
}
