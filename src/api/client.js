const API_BASE = '/api'

const tokenKey = 'appmodel_token'

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token) {
  localStorage.setItem(tokenKey, token)
}

export function clearToken() {
  localStorage.removeItem(tokenKey)
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.errors?.join(', ') || 'Request failed')
  return data
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  me: () => request('/auth/me'),

  // Devices
  getDevices: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/devices${qs ? '?' + qs : ''}`)
  },

  getDevice: (id) => request(`/devices/${id}`),

  createDevice: (data) =>
    request('/devices', { method: 'POST', body: JSON.stringify(data) }),

  updateDevice: (id, data) =>
    request(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggleDevice: (id) =>
    request(`/devices/${id}/toggle`, { method: 'PATCH' }),

  deleteDevice: (id) =>
    request(`/devices/${id}`, { method: 'DELETE' }),

  // Simulate
  calculate: (data) =>
    request('/simulate/calculate', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
}
