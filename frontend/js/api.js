import { API } from './config.js'

export function getToken() {
  return localStorage.getItem('dnd_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('dnd_token', token)
  else localStorage.removeItem('dnd_token')
}

function parseError(res, data, url) {
  if (data?.error) return data
  return { error: data?.message || `HTTP ${res.status} — ${url}` }
}

export async function apiGet(service, path) {
  const url = `${API[service]}${path}`
  let res
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw { error: `Нет связи с ${service}. Проверьте URL в config.js и деплой.` }
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw parseError(res, data, url)
  return data
}

export async function apiPost(service, path, body) {
  const url = `${API[service]}${path}`
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw { error: `Нет связи с ${service}. Проверьте URL в config.js и деплой.` }
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw parseError(res, data, url)
  return data
}

export async function apiDelete(service, path) {
  const url = `${API[service]}${path}`
  let res
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
      },
    })
  } catch {
    throw { error: `Нет связи с ${service}. Проверьте URL в config.js и деплой.` }
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw parseError(res, data, url)
  return data
}
