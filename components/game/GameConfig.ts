// components/game/GameConfig.ts

export const CAT_MODELS = {
  default: '/assets/models/cat.glb',
  superhero: '/assets/models/cat_superhero.glb',
  legendary: '/assets/models/cat_legendary.glb',
} as const

export const getCatModel = (score: number): string => {
  if (score >= 1000) return CAT_MODELS.legendary
  if (score >= 50) return CAT_MODELS.superhero
  return CAT_MODELS.default
}

export const getCatInfo = (score: number) => {
  if (score >= 1000) {
    return {
      name: 'Легендарный кот',
      emoji: '👑',
      text: 'Повелитель вселенной! 🌟',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
    }
  }
  if (score >= 50) {
    return {
      name: 'Кот-супергерой',
      emoji: '🦸‍♂️',
      text: 'Спасает мир от скуки! ⚡',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
    }
  }
  return {
    name: 'Кибер-кот',
    emoji: '🐱',
    text: 'Твой верный друг! 🐾',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  }
}