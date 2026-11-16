export interface RestorationMilestone {
  id: string;
  name: string;
  description: string;
  goldCost: number;
  /** Visual stage index 0..n after purchase */
  stage: number;
}

export const RESTORATION_MILESTONES: RestorationMilestone[] = [
  {
    id: 'clear_debris',
    name: 'Clear Debris',
    description: 'Clear overgrown vines and fallen branches.',
    goldCost: 20,
    stage: 1,
  },
  {
    id: 'restore_gazebo',
    name: 'Restore Gazebo',
    description: 'Repair the weathered garden gazebo.',
    goldCost: 45,
    stage: 2,
  },
  {
    id: 'plant_flowers',
    name: 'Plant Decorative Flowers',
    description: 'Fill beds with colorful blooms.',
    goldCost: 70,
    stage: 3,
  },
  {
    id: 'restore_fountain',
    name: 'Restore Fountain',
    description: 'Bring the crystal fountain back to life.',
    goldCost: 100,
    stage: 4,
  },
  {
    id: 'koi_pond',
    name: 'Unlock Koi Pond',
    description: 'Open the serene Koi Pond biome.',
    goldCost: 140,
    stage: 5,
  },
];
