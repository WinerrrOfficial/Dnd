import { apiGet, apiPost, getToken, setToken } from './api.js'

export function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html'
    return false
  }
  return true
}

export async function initLoginForm() {
  const form = document.getElementById('login-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const errEl = document.getElementById('error')

    try {
      const data = await apiPost('auth', '/login', { username, password })
      setToken(data.token)
      window.location.href = 'index.html'
    } catch (err) {
      errEl.textContent = err.error || 'Ошибка входа'
      errEl.hidden = false
    }
  })
}

export async function initRegisterForm() {
  const form = document.getElementById('register-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const errEl = document.getElementById('error')

    try {
      const data = await apiPost('auth', '/register', { username, password })
      setToken(data.token)
      window.location.href = 'index.html'
    } catch (err) {
      errEl.textContent = err.error || 'Ошибка регистрации'
      errEl.hidden = false
    }
  })
}

export async function loadCurrentUser() {
  try {
    const data = await apiGet('auth', '/me')
    return data.user
  } catch {
    return null
  }
}

export function logout() {
  setToken(null)
  window.location.href = 'login.html'
}
