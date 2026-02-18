import type { UserType } from "@/types/user"

export interface Account {
    id?: string
    password?: string,
    tokenKey?: string
    email?: string
    emailVisibility?: string
    userName?: string
    fullName?: string
    roles?: UserType[]
    avatar?: string
    created?:Date
    updated?:Date
}
