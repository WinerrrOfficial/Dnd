import { fetchFeat, fetchRace, fetchSpell } from './fetch'

type SpellRecord = {
  name?: string
  error?: string
  requirements?: {
    allowed_races?: string[]
    banned_races?: string[]
  }
}

export async function validateCharacterData(
  token: string,
  raceId: string,
  spellIds?: string[],
  featIds?: string[]
): Promise<string | null> {
  try {
    const race = await fetchRace(token, raceId)
    if (!race || (race as { error?: string }).error) {
      return 'Race not found or not available'
    }
  } catch {
    return 'Failed to validate race: races service unavailable'
  }

  if (spellIds?.length) {
    for (const sid of spellIds) {
      try {
        const spell = (await fetchSpell(token, sid)) as SpellRecord
        if (!spell || spell.error) {
          return `Spell ${sid} not found or not available`
        }

        const reqs = spell.requirements || {}
        if (reqs.allowed_races?.length && !reqs.allowed_races.includes(raceId)) {
          return `Spell "${spell.name}" is not allowed for selected race`
        }
        if (reqs.banned_races?.includes(raceId)) {
          return `Spell "${spell.name}" is banned for selected race`
        }
      } catch {
        return 'Failed to validate spell: spells service unavailable'
      }
    }
  }

  if (featIds?.length) {
    for (const fid of featIds) {
      try {
        const feat = await fetchFeat(token, fid)
        if (!feat || (feat as { error?: string }).error) {
          return `Feat ${fid} not found or not available`
        }
      } catch {
        return 'Failed to validate feat: feats service unavailable'
      }
    }
  }

  return null
}
