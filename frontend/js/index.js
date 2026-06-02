import { apiGet } from './api.js'
import { loadCurrentUser, logout, requireAuth } from './auth.js'

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return

  const user = await loadCurrentUser()
  const userEl = document.getElementById('username-display')
  if (userEl && user) userEl.textContent = user.username

  document.getElementById('logout-btn')?.addEventListener('click', logout)

  const listEl = document.getElementById('characters-list')
  try {
    const chars = await apiGet('characters', '/characters')
    if (!chars.length) {
      listEl.innerHTML = '<p class="muted">Пока нет персонажей. <a href="create.html">Создать</a></p>'
      return
    }
    listEl.innerHTML = chars
      .map(
        (c) => `
      <a class="card" href="sheet.html?id=${c.id}">
        <strong>${escapeHtml(c.name)}</strong>
        <span class="muted">Ур. ${c.level} · ${escapeHtml(c.class || 'без класса')}</span>
      </a>
    `
      )
      .join('')
  } catch (err) {
    listEl.innerHTML = `<p class="error">${err.error || 'Не удалось загрузить персонажей'}</p>`
  }
})

function escapeHtml(s) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}
