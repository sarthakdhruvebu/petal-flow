export type ChainId = 'seed' | 'mushroom' | 'crystal';

export interface ItemDef {
  id: string;
  displayName: string;
  chainId: ChainId;
  tier: number;
  producerId: string;
  spriteKey: string;
  bloomEligible: boolean;
  color: number;
  label: string;
}

export const SEED_CHAIN: ItemDef[] = [
  {
    id: 'sprout',
    displayName: 'Sprout',
    chainId: 'seed',
    tier: 1,
    producerId: 'seed_packet',
    spriteKey: 'item_sprout',
    bloomEligible: false,
    color: 0x7cb342,
    label: 'Sp',
  },
  {
    id: 'leaf',
    displayName: 'Leaf',
    chainId: 'seed',
    tier: 2,
    producerId: 'seed_packet',
    spriteKey: 'item_leaf',
    bloomEligible: false,
    color: 0x66bb6a,
    label: 'Lf',
  },
  {
    id: 'bud',
    displayName: 'Bud',
    chainId: 'seed',
    tier: 3,
    producerId: 'seed_packet',
    spriteKey: 'item_bud',
    bloomEligible: true,
    color: 0xf48fb1,
    label: 'Bd',
  },
  {
    id: 'flower',
    displayName: 'Flower',
    chainId: 'seed',
    tier: 4,
    producerId: 'seed_packet',
    spriteKey: 'item_flower',
    bloomEligible: true,
    color: 0xec407a,
    label: 'Fl',
  },
  {
    id: 'blooming_flower',
    displayName: 'Blooming Flower',
    chainId: 'seed',
    tier: 5,
    producerId: 'seed_packet',
    spriteKey: 'item_blooming',
    bloomEligible: true,
    color: 0xab47bc,
    label: 'Bl',
  },
  {
    id: 'magical_flower',
    displayName: 'Magical Flower',
    chainId: 'seed',
    tier: 6,
    producerId: 'seed_packet',
    spriteKey: 'item_magical',
    bloomEligible: false,
    color: 0x7e57c2,
    label: 'Mg',
  },
];

export const MUSHROOM_CHAIN: ItemDef[] = [
  {
    id: 'tiny_mushroom',
    displayName: 'Tiny Mushroom',
    chainId: 'mushroom',
    tier: 1,
    producerId: 'mushroom_log',
    spriteKey: 'item_tiny_mushroom',
    bloomEligible: false,
    color: 0xd7ccc8,
    label: 'Tm',
  },
  {
    id: 'mushroom',
    displayName: 'Mushroom',
    chainId: 'mushroom',
    tier: 2,
    producerId: 'mushroom_log',
    spriteKey: 'item_mushroom',
    bloomEligible: false,
    color: 0xef9a9a,
    label: 'Mu',
  },
  {
    id: 'mushroom_cluster',
    displayName: 'Mushroom Cluster',
    chainId: 'mushroom',
    tier: 3,
    producerId: 'mushroom_log',
    spriteKey: 'item_mushroom_cluster',
    bloomEligible: true,
    color: 0xe57373,
    label: 'Mc',
  },
  {
    id: 'glowing_mushroom',
    displayName: 'Glowing Mushroom',
    chainId: 'mushroom',
    tier: 4,
    producerId: 'mushroom_log',
    spriteKey: 'item_glowing_mushroom',
    bloomEligible: false,
    color: 0xff8a65,
    label: 'Gm',
  },
];

export const CRYSTAL_CHAIN: ItemDef[] = [
  {
    id: 'crystal_droplet',
    displayName: 'Crystal Droplet',
    chainId: 'crystal',
    tier: 1,
    producerId: 'crystal_spring',
    spriteKey: 'item_crystal_droplet',
    bloomEligible: false,
    color: 0xb3e5fc,
    label: 'Cd',
  },
  {
    id: 'crystal',
    displayName: 'Crystal',
    chainId: 'crystal',
    tier: 2,
    producerId: 'crystal_spring',
    spriteKey: 'item_crystal',
    bloomEligible: false,
    color: 0x81d4fa,
    label: 'Cr',
  },
  {
    id: 'crystal_cluster',
    displayName: 'Crystal Cluster',
    chainId: 'crystal',
    tier: 3,
    producerId: 'crystal_spring',
    spriteKey: 'item_crystal_cluster',
    bloomEligible: true,
    color: 0x4fc3f7,
    label: 'Cc',
  },
  {
    id: 'prismatic_crystal',
    displayName: 'Prismatic Crystal',
    chainId: 'crystal',
    tier: 4,
    producerId: 'crystal_spring',
    spriteKey: 'item_prismatic_crystal',
    bloomEligible: false,
    color: 0x26c6da,
    label: 'Pc',
  },
];

export const ALL_ITEMS: ItemDef[] = [...SEED_CHAIN, ...MUSHROOM_CHAIN, ...CRYSTAL_CHAIN];

const byId = new Map(ALL_ITEMS.map((d) => [d.id, d]));
const byChainTier = new Map(ALL_ITEMS.map((d) => [`${d.chainId}:${d.tier}`, d]));

export function getItemDef(id: string): ItemDef | undefined {
  return byId.get(id);
}

export function getItemDefByTier(chainId: ChainId, tier: number): ItemDef | undefined {
  return byChainTier.get(`${chainId}:${tier}`);
}

export function getNextItemDef(id: string): ItemDef | undefined {
  const current = getItemDef(id);
  if (!current) return undefined;
  return getItemDefByTier(current.chainId, current.tier + 1);
}

export function isMaxTier(id: string): boolean {
  return getNextItemDef(id) === undefined;
}
