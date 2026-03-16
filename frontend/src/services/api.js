import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to authorization header if available
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('authToken', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('authToken')
  }
}

// Restore token from localStorage on app load
const savedToken = localStorage.getItem('authToken')
if (savedToken) {
  setAuthToken(savedToken)
}

// Authentication
export const authenticate = (password) => {
  return api.post('/auth/', { password })
}

// BP Entries endpoints
export const getEntries = () => {
  return api.get('/entries/')
}

export const createEntry = (data) => {
  return api.post('/entries/', data)
}

export const updateEntry = (id, data) => {
  return api.patch(`/entries/${id}/`, data)
}

export const deleteEntry = (id) => {
  return api.delete(`/entries/${id}/`)
}

export const exportCSV = () => {
  return api.get('/entries/export/', { responseType: 'blob' })
}

export const importData = (entries, mode = 'merge') => {
  return api.post('/entries/import/', { entries, mode })
}

export default api
