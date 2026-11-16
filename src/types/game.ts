export type ResourceType = "gold" | "elixir" | "gems";

export interface Resources {
  gold: number;
  maxGold: number;
  elixir: number;
  maxElixir: number;
  gems: number;
}

export type BuildingType =
  | "town_hall"
  | "gold_mine"
  | "elixir_collector"
  | "gold_storage"
  | "elixir_storage"
  | "builder_hut"
  | "forge_of_code"
  | "dojo_of_strength"
  | "sanctum_of_knowledge"
  | "temple_of_mindfulness"
  | "archer_tower";

export type BuildingCategory = "core" | "resources" | "goals" | "defense";

export interface BuildingUpgradeConfig {
  level: number;
  costGold: number;
  costElixir: number;
  costGems: number;
  buildTimeSeconds: number; // in-game build duration
  productionRatePerHour?: number; // for mines & collectors
  storageCapacity?: number; // for storages
  requiredTownHallLevel: number;
  description: string;
  goalBonusDescription: string;
}

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  category: BuildingCategory;
  size: [number, number]; // width, length in grid units
  maxLevel: number;
  maxCount: number;
  levels: Record<number, BuildingUpgradeConfig>;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  goalCategory?: GoalCategory;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  level: number;
  x: number; // grid coordinate X
  z: number; // grid coordinate Z
  // Upgrade state
  isUpgrading?: boolean;
  upgradeStartTime?: number; // epoch ms
  upgradeDurationMs?: number; // duration in ms
  // Production state
  lastCollectedTime?: number;
  uncollectedResources?: number;
  // Associated custom real-life goal IDs
  linkedGoalIds?: string[];
}

export type GoalCategory = "coding" | "fitness" | "knowledge" | "mindfulness" | "general";

export interface RealLifeGoal {
  id: string;
  title: string;
  category: GoalCategory;
  targetMetric: string; // e.g. "Hours", "Pages", "Workouts", "Tasks"
  currentProgress: number;
  targetProgress: number;
  associatedBuildingType?: BuildingType;
  rewardGold: number;
  rewardElixir: number;
  rewardGems: number;
  rewardXp: number;
  timerReductionMinutes: number; // speeding up current constructions
  completed: boolean;
  streakDays: number;
  lastLoggedDate?: string; // YYYY-MM-DD
}

export interface BuilderState {
  total: number;
  busy: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  maxXp: number;
  goalsCompletedTotal: number;
  hoursInvestedTotal: number;
  streakDays: number;
}

export interface GameState {
  resources: Resources;
  buildings: PlacedBuilding[];
  goals: RealLifeGoal[];
  playerStats: PlayerStats;
  soundEnabled: boolean;
  lastUpdated: number;
}
