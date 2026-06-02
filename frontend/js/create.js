import { apiGet, apiPost } from './api.js'
import { requireAuth } from './auth.js'

let allSpells = []
let allFeats = []

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return

  const raceSelect = document.getElementById('race-select')
  const classInput = document.getElementById('char-class')
  const levelInput = document.getElementById('char-level')

  try {
    let races, spells, feats
    try {
      races = await apiGet('races', '/races')
    } catch (e) {
      throw { error: `Расы — ${e.error || 'сервис недоступен'}` }
    }
    try {
      spells = await apiGet('spells', '/spells')
    } catch (e) {
      throw { error: `Заклинания — ${e.error || 'сервис недоступен'}` }
    }
    try {
      feats = await apiGet('feats', '/feats')
    } catch (e) {
      throw { error: `Фокусы — ${e.error || 'сервис недоступен'}` }
    }

    allSpells = spells
    allFeats = feats

    races.forEach((r) => {
      const opt = document.createElement('option')
      opt.value = r.id
      opt.textContent = `${r.name}${r.source === 'user' ? ' (моё)' : ''}`
      raceSelect.appendChild(opt)
    })

    renderCheckboxes('feats-container', allFeats)
    filterSpellsForRace(raceSelect.value)

    raceSelect.addEventListener('change', () => filterSpellsForRace(raceSelect.value))
  } catch (err) {
    alert(err.error || 'Ошибка загрузки справочников')
  }

  document.getElementById('create-btn')?.addEventListener('click', async () => {
    const charName = document.getElementById('char-name').value.trim()
    const raceId = raceSelect.value
    const spellIds = getChecked('spells-container')
    const featIds = getChecked('feats-container')

    if (!charName || !raceId) {
      alert('Укажите имя и расу')
      return
    }

    try {
      const char = await apiPost('characters', '/characters', {
        name: charName,
        race_id: raceId,
        class: classInput?.value || '',
        level: parseInt(levelInput?.value || '1', 10) || 1,
        spell_ids: spellIds,
        feat_ids: featIds,
      })
      window.location.href = `sheet.html?id=${char.id}`
    } catch (err) {
      alert(err.error || 'Ошибка создания')
    }
  })
})

function filterSpellsForRace(raceId) {
  const filtered = allSpells.filter((s) => {
    const req = s.requirements || {}
    if (req.allowed_races?.length) return req.allowed_races.includes(raceId)
    if (req.banned_races?.length) return !req.banned_races.includes(raceId)
    return true
  })
  renderCheckboxes('spells-container', filtered)
}

function renderCheckboxes(containerId, items) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.innerHTML = ''
  items.forEach((item) => {
    const label = document.createElement('label')
    label.className = 'checkbox-item'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.value = item.id
    label.appendChild(checkbox)
    label.appendChild(document.createTextNode(` ${item.name}`))
    container.appendChild(label)
  })
}

function getChecked(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(
    (cb) => cb.value
  )
}
