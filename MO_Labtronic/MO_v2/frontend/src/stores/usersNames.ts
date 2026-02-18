import { defineStore } from "pinia";
import { apiHandle } from "@/services/apiService";
import type { ReturnMessage } from "@/types/systemMessage";
import { ref } from "vue";
const useUsersNames = defineStore('usersNames', () => {
    const usersNames = ref<any[] | null>(null)

    async function fetchUsers(): Promise<ReturnMessage | null> {
        const response  = await apiHandle('/api/collections/Accounts_T/records', 'GET', true, `?fields=id,Full_Name,Role,)`)
        return response
    }
    async function getUsers() {
        if (usersNames.value) {
            return usersNames.value
        }
        const res = await fetchUsers()
        usersNames.value = res?.data?.items || []
        return usersNames.value
    }
    return { getUsers }
})

export default useUsersNames