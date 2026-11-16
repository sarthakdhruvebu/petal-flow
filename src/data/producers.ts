export interface ProducerDef {
  id: string;
  name: string;
  outputItemId: string;
  /** Garden level required to unlock */
  unlockLevel: number;
  color: number;
  /** Offline items produced per hour */
  offlinePerHour: number;
  /** Max items stored in hopper for this producer */
  hopperCap: number;
  spriteKey: string;
}

export const PRODUCERS: ProducerDef[] = [
  {
    id: 'seed_packet',
    name: 'Seed Packet',
    outputItemId: 'sprout',
    unlockLevel: 1,
    color: 0xc8e6c9,
    offlinePerHour: 30,
    hopperCap: 20,
    spriteKey: 'producer_seed',
  },
  {
    id: 'mushroom_log',
    name: 'Mushroom Log',
    outputItemId: 'tiny_mushroom',
    unlockLevel: 4,
    color: 0xd7ccc8,
    offlinePerHour: 20,
    hopperCap: 16,
    spriteKey: 'producer_mushroom',
  },
  {
    id: 'crystal_spring',
    name: 'Crystal Spring',
    outputItemId: 'crystal_droplet',
    unlockLevel: 6,
    color: 0xb3e5fc,
    offlinePerHour: 15,
    hopperCap: 12,
    spriteKey: 'producer_crystal',
  },
];

export function getProducer(id: string): ProducerDef | undefined {
  return PRODUCERS.find((p) => p.id === id);
}

export function producersUnlockedAt(level: number): ProducerDef[] {
  return PRODUCERS.filter((p) => level >= p.unlockLevel);
}
