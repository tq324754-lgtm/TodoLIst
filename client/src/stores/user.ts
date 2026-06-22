import { defineStore } from 'pinia'

interface UserState {
  userId: string | null
  username: string | null
  role: string | null
  token: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: null,
    username: null,
    role: null,
    token: null
  }),
  actions: {
    setUserInfo(userId: string, username: string, role: string = 'user', token: string = '') {
      this.userId = userId
      this.username = username
      this.role = role
      this.token = token
    },
    clearUserInfo() {
      this.userId = null
      this.username = null
      this.role = null
      this.token = null
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.userId,
    currentUser: (state) => state.username,
    isAdmin: (state) => state.role === 'admin'
  },
  persist: true
})
