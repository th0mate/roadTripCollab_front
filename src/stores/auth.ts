import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const token = ref<string | null>(null)

  function checkAuth() {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      isAuthenticated.value = true
      token.value = savedToken
    } else {
      isAuthenticated.value = false
      token.value = null
    }
  }

  function login(newToken: string) {
    localStorage.setItem('authToken', newToken)
    isAuthenticated.value = true
    token.value = newToken
  }

  function logout() {
    localStorage.removeItem('authToken')
    isAuthenticated.value = false
    token.value = null
  }

  return { isAuthenticated, token, checkAuth, login, logout }
})
