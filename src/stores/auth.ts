import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const token = ref<string | null>(null)
  const isAdmin = ref(false)

  function checkAuth() {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      isAuthenticated.value = true
      token.value = savedToken
      isAdmin.value = localStorage.getItem('isAdmin') === 'true'
    } else {
      isAuthenticated.value = false
      token.value = null
      isAdmin.value = false
    }
  }

  function login(newToken: string, adminFlag = false) {
    localStorage.setItem('authToken', newToken)
    localStorage.setItem('isAdmin', String(adminFlag))
    isAuthenticated.value = true
    token.value = newToken
    isAdmin.value = adminFlag
  }

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('isAdmin')
    isAuthenticated.value = false
    token.value = null
    isAdmin.value = false
  }

  return { isAuthenticated, token, isAdmin, checkAuth, login, logout }
})
