const RACES_URL = process.env.RACES_SERVICE_URL || 'http://localhost:3002'
const SPELLS_URL = process.env.SPELLS_SERVICE_URL || 'http://localhost:3003'
const FEATS_URL = process.env.FEATS_SERVICE_URL || 'http://localhost:3004'

export async function fetchWithAuth<T = Record<string, unknown>>(
  url: string,
  token: string
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return res.json() as Promise<T>
}

export async function fetchRace(token: string, raceId: string) {
  return fetchWithAuth(`${RACES_URL}/api/races/${raceId}`, token)
}

export async function fetchSpell(token: string, spellId: string) {
  return fetchWithAuth(`${SPELLS_URL}/api/spells/${spellId}`, token)
}

export async function fetchFeat(token: string, featId: string) {
  return fetchWithAuth(`${FEATS_URL}/api/feats/${featId}`, token)
}
