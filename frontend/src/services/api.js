import axios from 'axios'
import { ref } from 'vue'

const TOKEN_KEY = 'authToken'

// Reactive so the app switches to the login screen as soon as the token is cleared
export const authToken = ref(localStorage.getItem(TOKEN_KEY))

export const setAuthToken = (token) => {
  authToken.value = token
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  if (authToken.value) config.headers.Authorization = `Bearer ${authToken.value}`
  return config
})

// An expired or invalid token logs the user out
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && authToken.value) setAuthToken(null)
  return Promise.reject(error)
})

export const errorMessage = (error, fallback) => error.response?.data?.error || fallback

export const authenticate = (password) => api.post('/auth/', { password })
export const getEntries = () => api.get('/entries/')
export const getPublicEntries = () => api.get('/public/')
export const createEntry = (data) => api.post('/entries/', data)
export const updateEntry = (id, data) => api.patch(`/entries/${id}/`, data)
export const deleteEntry = (id) => api.delete(`/entries/${id}/`)
export const importData = (entries, mode = 'merge') => api.post('/entries/import/', { entries, mode })
