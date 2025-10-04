const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (err) {
    throw new Error('Invalid JSON response')
  }
  if (!res.ok) {
    const message = data.error || data.message || 'Request failed'
    const err = new Error(message)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function signup({ name, email, password, companyName, country, locale }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, companyName, country, locale }),
  })
}

export async function login({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function saveAuth(token, user) {
  if (token) localStorage.setItem('token', token)
  if (user) localStorage.setItem('user', JSON.stringify(user))
}

export function getToken() {
  return localStorage.getItem('token')
}
