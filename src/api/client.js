import { calculate as clientCalculate, validateInput as clientValidateInput } from '../utils/calcEngine.js'

const API_BASE = '/api'
const tokenKey = 'appmodel_token'
const userKey = 'appmodel_user'
const devicesKey = 'appmodel_devices_v2'
const settingsKey = 'appmodel_settings_v1'

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function setToken(token) {
  localStorage.setItem(tokenKey, token)
}

export function clearToken() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}

// Initial 10 devices fallback for standalone/Vercel static deployment
const DEFAULT_DEVICES = [
  { id: 1, device_id: '5M', device_name: 'Device 5M', status: 'Active', cogs: 200000, cogs_mrc: 200000, otc_enabled: 1, default_otc_price: 225000, mrc_enabled: 1, default_daily_fee: 1500, default_daily_incentive: 500, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 2, device_id: 'QS6', device_name: 'Soundbox QS6', status: 'Active', cogs: 323441, cogs_mrc: 383441, otc_enabled: 1, default_otc_price: 375000, mrc_enabled: 1, default_daily_fee: 2000, default_daily_incentive: 700, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 3, device_id: 'QS5M', device_name: 'Soundbox QS5M', status: 'Active', cogs: 319200, cogs_mrc: 379200, otc_enabled: 1, default_otc_price: 350000, mrc_enabled: 1, default_daily_fee: 1800, default_daily_incentive: 600, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 4, device_id: 'QS2', device_name: 'Soundbox QS2', status: 'Active', cogs: 318203, cogs_mrc: 493203, otc_enabled: 1, default_otc_price: 475000, mrc_enabled: 1, default_daily_fee: 2700, default_daily_incentive: 900, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 5, device_id: 'QS3D', device_name: 'Soundbox QS3D', status: 'Active', cogs: 446250, cogs_mrc: 566250, otc_enabled: 1, default_otc_price: 599000, mrc_enabled: 1, default_daily_fee: 3000, default_daily_incentive: 1000, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 6, device_id: 'P5K', device_name: 'EDC P5K 8GB', status: 'Active', cogs: 1268438, cogs_mrc: 1628438, otc_enabled: 1, default_otc_price: 1750000, mrc_enabled: 1, default_daily_fee: 8000, default_daily_incentive: 2700, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 7, device_id: 'P5SE', device_name: 'EDC P5SE', status: 'Active', cogs: 1631438, cogs_mrc: 2051438, otc_enabled: 1, default_otc_price: 2250000, mrc_enabled: 1, default_daily_fee: 11000, default_daily_incentive: 3700, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 8, device_id: 'Q3 MINI', device_name: 'EDC Q3 Mini', status: 'Active', cogs: 959888, cogs_mrc: 1259888, otc_enabled: 1, default_otc_price: 1499000, mrc_enabled: 1, default_daily_fee: 6800, default_daily_incentive: 2300, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 9, device_id: 'Q3', device_name: 'EDC Q3', status: 'Active', cogs: 1685888, cogs_mrc: 2082675, otc_enabled: 1, default_otc_price: 2399000, mrc_enabled: 1, default_daily_fee: 11000, default_daily_incentive: 3700, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 },
  { id: 10, device_id: 'Q2', device_name: 'EDC Q2', status: 'Active', cogs: 1920000, cogs_mrc: 2746688, otc_enabled: 1, default_otc_price: 2850000, mrc_enabled: 1, default_daily_fee: 13600, default_daily_incentive: 4500, default_setup_fee: 0, default_active_days: 22, default_active_rate: 50, default_program_period: 12 }
]

function getLocalDevices() {
  const saved = localStorage.getItem(devicesKey)
  if (saved) {
    try { return JSON.parse(saved) } catch {}
  }
  localStorage.setItem(devicesKey, JSON.stringify(DEFAULT_DEVICES))
  return DEFAULT_DEVICES
}

function saveLocalDevices(devs) {
  localStorage.setItem(devicesKey, JSON.stringify(devs))
}

function getLocalSettings() {
  const saved = localStorage.getItem(settingsKey)
  if (saved) {
    try { return JSON.parse(saved) } catch {}
  }
  const def = { bep_threshold_months: '10' }
  localStorage.setItem(settingsKey, JSON.stringify(def))
  return def
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('NOT_API_SERVER')
    }

    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
      throw new Error('Session expired')
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.errors?.join(', ') || 'Request failed')
    return data
  } catch (err) {
    // If backend is not available (e.g. running as pure static SPA on Vercel/Netlify), fallback to local
    return handleLocalFallback(path, options, err)
  }
}

function handleLocalFallback(path, options, originalError) {
  if (originalError && originalError.message !== 'NOT_API_SERVER' && !originalError.message.includes('Failed to fetch') && !originalError.message.includes('NetworkError')) {
    throw originalError
  }

  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : {}

  // Auth: Login
  if (path === '/auth/login' && method === 'POST') {
    const { username, password } = body
    if ((username === 'admin' && password === 'admin123') || (username === 'user' && password === 'user123')) {
      const role = username === 'admin' ? 'admin' : 'user'
      const user = { id: username === 'admin' ? 1 : 2, username, role }
      const token = `local_${username}_${Date.now()}`
      setToken(token)
      localStorage.setItem(userKey, JSON.stringify(user))
      return { token, user }
    }
    throw new Error('Username atau password salah (Gunakan admin/admin123 atau user/user123)')
  }

  // Auth: Me
  if (path === '/auth/me') {
    const savedUser = localStorage.getItem(userKey)
    if (savedUser) return JSON.parse(savedUser)
    return { id: 1, username: 'admin', role: 'admin' }
  }

  // Settings
  if (path === '/settings' && method === 'GET') {
    return getLocalSettings()
  }

  if (path === '/settings' && method === 'PUT') {
    const settings = { ...getLocalSettings(), ...body }
    localStorage.setItem(settingsKey, JSON.stringify(settings))
    return { success: true, settings }
  }

  // Devices
  if (path.startsWith('/devices')) {
    let devs = getLocalDevices()

    if (path === '/devices' && method === 'GET') {
      return devs
    }

    if (path.startsWith('/devices?') && method === 'GET') {
      const url = new URL('http://dummy' + path)
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')
      let filtered = devs
      if (status) {
        filtered = filtered.filter(d => d.status.toLowerCase() === status.toLowerCase())
      }
      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(d => d.device_name.toLowerCase().includes(q) || d.device_id.toLowerCase().includes(q))
      }
      return filtered
    }

    if (path === '/devices' && method === 'POST') {
      const newDev = {
        ...body,
        id: Date.now(),
        status: body.status || 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      devs.push(newDev)
      saveLocalDevices(devs)
      return { success: true, device: newDev }
    }

    const matchToggle = path.match(/^\/devices\/([^/]+)\/toggle$/)
    if (matchToggle && method === 'PATCH') {
      const id = matchToggle[1]
      devs = devs.map(d => String(d.id) === String(id) ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d)
      saveLocalDevices(devs)
      return { success: true }
    }

    const matchOne = path.match(/^\/devices\/([^/]+)$/)
    if (matchOne) {
      const id = matchOne[1]
      if (method === 'GET') {
        const d = devs.find(x => String(x.id) === String(id))
        if (!d) throw new Error('Device not found')
        return d
      }
      if (method === 'PUT') {
        devs = devs.map(d => String(d.id) === String(id) ? { ...d, ...body, updated_at: new Date().toISOString() } : d)
        saveLocalDevices(devs)
        return { success: true }
      }
      if (method === 'DELETE') {
        devs = devs.filter(d => String(d.id) !== String(id))
        saveLocalDevices(devs)
        return { success: true }
      }
    }
  }

  // Simulate: calculate
  if (path === '/simulate/calculate' && method === 'POST') {
    const errs = clientValidateInput(body)
    if (errs && errs.length > 0) {
      throw new Error(errs.join(', '))
    }
    const settings = getLocalSettings()
    const threshold = parseFloat(settings.bep_threshold_months) || 10
    return clientCalculate(body, threshold)
  }

  throw new Error(`Endpoint ${path} not implemented`)
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
