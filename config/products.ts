// config/products.ts
export interface Product {
  id: string
  name: string
  description: string
  priceStars: number
  priceTon: number
  effect: string
  effectValue: any
  category: 'energy' | 'level' | 'vip' | 'skin' | 'mega'
  popular?: boolean
  icon?: string
}

export const PRODUCTS: Product[] = [
  // Энергия
  {
    id: 'energy_100',
    name: '100 энергии',
    description: 'Пополняет энергию на 100 единиц',
    priceStars: 50,
    priceTon: 0.5,
    effect: 'add_energy',
    effectValue: 100,
    category: 'energy',
    popular: true,
  },
  {
    id: 'energy_500',
    name: '500 энергии',
    description: 'Пополняет энергию на 500 единиц',
    priceStars: 200,
    priceTon: 2.0,
    effect: 'add_energy',
    effectValue: 500,
    category: 'energy',
  },
  {
    id: 'energy_1000',
    name: '1000 энергии',
    description: 'Пополняет энергию на 1000 единиц',
    priceStars: 350,
    priceTon: 3.5,
    effect: 'add_energy',
    effectValue: 1000,
    category: 'energy',
  },
  {
    id: 'energy_5000',
    name: '5000 энергии',
    description: 'Пополняет энергию на 5000 единиц',
    priceStars: 1500,
    priceTon: 15.0,
    effect: 'add_energy',
    effectValue: 5000,
    category: 'energy',
    popular: true,
  },
  
  // Уровни
  {
    id: 'level_boost',
    name: 'Повышение уровня',
    description: '+1 уровень и 50 очков',
    priceStars: 100,
    priceTon: 1.0,
    effect: 'add_level',
    effectValue: 1,
    category: 'level',
  },
  {
    id: 'level_boost_big',
    name: 'Мега повышение уровня',
    description: '+3 уровня и 200 очков',
    priceStars: 250,
    priceTon: 2.5,
    effect: 'add_level',
    effectValue: 3,
    category: 'level',
  },
  
  // VIP
  {
    id: 'vip_7days',
    name: 'VIP на 7 дней',
    description: '+100% пассивного дохода на 7 дней',
    priceStars: 500,
    priceTon: 5.0,
    effect: 'set_vip',
    effectValue: 7,
    category: 'vip',
    popular: true,
  },
  {
    id: 'vip_30days',
    name: 'VIP на 30 дней',
    description: '+100% пассивного дохода на 30 дней',
    priceStars: 1500,
    priceTon: 15.0,
    effect: 'set_vip',
    effectValue: 30,
    category: 'vip',
  },
  
  // Скины
  {
    id: 'skin_legendary',
    name: 'Легендарный скин',
    description: 'Уникальный скин + 100 очков',
    priceStars: 1000,
    priceTon: 10.0,
    effect: 'set_skin',
    effectValue: 'legendary',
    category: 'skin',
  },
  
  // Мега пакеты
  {
    id: 'mega_pack',
    name: 'Мега-пакет',
    description: 'Всё сразу: энергия + уровень + VIP + скин',
    priceStars: 2500,
    priceTon: 25.0,
    effect: 'mega_pack',
    effectValue: 'all',
    category: 'mega',
    popular: true,
  },
]

// ✅ Функция получения продукта по ID
export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

// ✅ Функция получения продуктов по категории
export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(p => p.category === category)
}

// ✅ Функция получения всех продуктов для магазина
export function getShopProducts(): Product[] {
  return PRODUCTS
}