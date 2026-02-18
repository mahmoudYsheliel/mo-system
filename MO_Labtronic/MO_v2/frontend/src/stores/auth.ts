import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { type ReturnMessage } from '@/types/systemMessage'
import { type UserType } from '@/types/user'
import { type Action } from '@/types/actions'
import { PERMISSIONS } from '@/constants/permissions'


export const useAuth = defineStore('auth', () => {
  const LOGIN_URL = 'https://mo.lab-tronic.com/database/api/collections/Accounts_T/auth-with-password'
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  // Computed state
  const isAuthenticated = computed(() => !!token.value)

  // Save helpers
  function setToken(newToken: string | null) {
    token.value = newToken
    if (newToken) localStorage.setItem('token', newToken)
    else localStorage.removeItem('token')
  }

  function setUser(newUser: any | null) {
    user.value = newUser
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser))
    else localStorage.removeItem('user')
  }

  // Auth actions
  async function login(email: string, pass: string): Promise<ReturnMessage> {
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password: pass }),
      })

      if (!res.ok)
        return { success: false, msg: 'Invalid credentials', data: null }

      const data = await res.json()
      if (!data.token || !data.record)
        return { success: false, msg: 'Incomplete response', data: null }

      setToken(data.token)
      setUser(data.record)
      return { success: true, msg: 'Authenticated successfully', data }

    } catch (err: unknown) {
      return { success: false, msg: err instanceof Error ? err.message : String(err), data: null }
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    window.location.reload()
  }
  function getUserRole() {
    return user.value.Role || null;
  }
  function canAccess(action: Action) {
    const role = getUserRole() as UserType
    if (PERMISSIONS[role])
      return PERMISSIONS[role].includes(action)
    return false
  }

  return { token, user, isAuthenticated, login, logout, getUserRole, canAccess,setUser,setToken }
})
