import { apiGet } from './api.js'
import { requireAuth } from './auth.js'

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return

  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  if (!id) {
    window.location.href = 'index.html'
    return
  }

  const content = document.getElementById('sheet-content')

  try {
    const char = await apiGet('characters', `/characters/${id}`)

    const spellsHtml =
      char.spells?.length > 0
        ? char.spells.map((s) => `<li>${escapeHtml(s.name)}</li>`).join('')
        : '<li class="muted">Нет</li>'

    const featsHtml =
      char.feats?.length > 0
        ? char.feats.map((f) => `<li>${escapeHtml(f.name)}</li>`).join('')
        : '<li class="muted">Нет</li>'

    content.innerHTML = `
      <header class="sheet-header">
        <h1>${escapeHtml(char.name)}</h1>
        <p class="muted">Уровень ${char.level} · ${escapeHtml(char.class || '—')}</p>
      </header>
      <section class="sheet-section">
        <h2>Раса</h2>
        <p><strong>${escapeHtml(char.race_name || '—')}</strong></p>
      </section>
      <section class="sheet-section">
        <h2>Заклинания</h2>
        <ul>${spellsHtml}</ul>
      </section>
      <section class="sheet-section">
        <h2>Фокусы</h2>
        <ul>${featsHtml}</ul>
      </section>
    `
  } catch (err) {
    content.innerHTML = `<p class="error">${err.error || 'Персонаж не найден'}</p>`
  }
})

function escapeHtml(s) {
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}
