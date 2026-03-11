// Token management in localStorage (deprecated - no auth required now)
const TOKEN_KEY = 'bp_token'

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const isAuthenticated = () => {
  return true  // Always authenticated without auth system
}
