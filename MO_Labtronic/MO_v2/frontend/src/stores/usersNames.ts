import { defineStore } from "pinia";
import { useApiHandler } from "@/services/apiService";
import type { ReturnMessage } from "@/types/systemMessage";
import { ref } from "vue";
const useUsersNames = defineStore('usersNames', () => {
    const usersNames = ref<Object[] | null>(null)

    async function fetchUsers(): Promise<ReturnMessage | null> {
        const { response, apiHandle } = useApiHandler()
        await apiHandle('/api/collections/Accounts_T/records', 'GET', true, `?fields=id,Full_Name,)`)
        return response.value
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