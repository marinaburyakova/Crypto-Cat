// types/shop.ts
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  priceTon: string;
  priceStars: number;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  effect: string;
  effectValue: any;
  popular: boolean;
  category: 'energy' | 'level' | 'vip' | 'skin' | 'mega' | 'other';
}

export interface UserData {
  id: string;
  points: number;
  energy: number;
  maxEnergy: number;
  level: number;
  exp: number;
  passiveRate: number;
  unclaimedPoints: number;
  skin: string;
  vipUntil: string | null;
  totalSpent: number;
}