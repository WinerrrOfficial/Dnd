import { API } from './config.js'

export function getToken() {
  return localStorage.getItem('dnd_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('dnd_token', token)
  else localStorage.removeItem('dnd_token')
}

export async function apiGet(service, path) {
  const res = await fetch(`${API[service]}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data
}

export async function apiPost(service, path, body) {
  const res = await fetch(`${API[service]}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data
}

export async function apiDelete(service, path) {
  const res = await fetch(`${API[service]}${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getToken() || ''}`,
    },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data
}
