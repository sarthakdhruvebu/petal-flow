export interface OrderTemplate {
  id: string;
  itemId: string;
  quantity: number;
  goldReward: number;
  xpReward: number;
  requirePrismatic?: boolean;
  /** Optional — not blocking progression */
  optional?: boolean;
  minLevel: number;
}

/** Data-driven Wish Jar pool. Prismatic orders are optional. */
export const ORDER_TEMPLATES: OrderTemplate[] = [
  { id: 'leaves_2', itemId: 'leaf', quantity: 2, goldReward: 8, xpReward: 10, minLevel: 1 },
  { id: 'buds_2', itemId: 'bud', quantity: 2, goldReward: 14, xpReward: 16, minLevel: 1 },
  { id: 'flower_1', itemId: 'flower', quantity: 1, goldReward: 18, xpReward: 20, minLevel: 1 },
  { id: 'leaves_3', itemId: 'leaf', quantity: 3, goldReward: 12, xpReward: 14, minLevel: 2 },
  { id: 'blooming_1', itemId: 'blooming_flower', quantity: 1, goldReward: 28, xpReward: 30, minLevel: 3 },
  {
    id: 'prism_flower_1',
    itemId: 'flower',
    quantity: 1,
    goldReward: 40,
    xpReward: 35,
    requirePrismatic: true,
    optional: true,
    minLevel: 3,
  },
  { id: 'mushroom_2', itemId: 'mushroom', quantity: 2, goldReward: 22, xpReward: 24, minLevel: 4 },
  { id: 'glow_mush_1', itemId: 'glowing_mushroom', quantity: 1, goldReward: 36, xpReward: 40, minLevel: 5 },
  { id: 'crystal_2', itemId: 'crystal', quantity: 2, goldReward: 30, xpReward: 32, minLevel: 6 },
  {
    id: 'prism_crystal_1',
    itemId: 'prismatic_crystal',
    quantity: 1,
    goldReward: 50,
    xpReward: 45,
    optional: true,
    minLevel: 6,
  },
];
