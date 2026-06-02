const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

export const API = isLocal
  ? {
      auth: 'http://localhost:3001/api',
      races: 'http://localhost:3002/api',
      spells: 'http://localhost:3003/api',
      feats: 'http://localhost:3004/api',
      characters: 'http://localhost:3005/api',
    }
  : {
      auth: 'https://dnd-auth.vercel.app/api',
      races: 'https://dnd-races.vercel.app/api',
      spells: 'https://dnd-spells-beige.vercel.app/api',
      feats: 'https://dnd-feats.vercel.app/api',
      characters: 'https://dnd-characters-sigma.vercel.app/api',
    }
