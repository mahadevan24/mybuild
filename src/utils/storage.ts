import { GameState, PlacedBuilding, RealLifeGoal } from "@/types/game";
import { BUILDING_DEFINITIONS } from "@/constants/buildings";
import { DEFAULT_GOALS } from "@/constants/goals";

const STORAGE_KEY = "goalclash_village_v1";

export const INITIAL_BUILDINGS: PlacedBuilding[] = [
  {
    id: "th-1",
    type: "town_hall",
    level: 1,
    x: 9,
    z: 9,
  },
  {
    id: "mine-1",
    type: "gold_mine",
    level: 1,
    x: 5,
    z: 9,
    lastCollectedTime: Date.now(),
    uncollectedResources: 50,
  },
  {
    id: "collector-1",
    type: "elixir_collector",
    level: 1,
    x: 14,
    z: 9,
    lastCollectedTime: Date.now(),
    uncollectedResources: 50,
  },
  {
    id: "hut-1",
    type: "builder_hut",
    level: 1,
    x: 5,
    z: 14,
  },
  {
    id: "hut-2",
    type: "builder_hut",
    level: 1,
    x: 14,
    z: 14,
  },
  {
    id: "forge-1",
    type: "forge_of_code",
    level: 1,
    x: 9,
    z: 5,
    linkedGoalIds: ["goal-code-1"],
  },
  {
    id: "dojo-1",
    type: "dojo_of_strength",
    level: 1,
    x: 9,
    z: 14,
    linkedGoalIds: ["goal-fitness-1"],
  },
];

export const INITIAL_GAME_STATE: GameState = {
  resources: {
    gold: 1500,
    maxGold: 4000,
    elixir: 1500,
    maxElixir: 4000,
    gems: 250,
  },
  buildings: INITIAL_BUILDINGS,
  goals: DEFAULT_GOALS,
  playerStats: {
    level: 2,
    xp: 180,
    maxXp: 350,
    goalsCompletedTotal: 3,
    hoursInvestedTotal: 8,
    streakDays: 4,
  },
  soundEnabled: true,
  lastUpdated: Date.now(),
};

export function recalculateCaps(buildings: PlacedBuilding[]) {
  let maxGold = 2500;
  let maxElixir = 2500;

  for (const b of buildings) {
    const def = BUILDING_DEFINITIONS[b.type];
    const lvlCfg = def?.levels[b.level];
    if (!lvlCfg) continue;

    if (b.type === "town_hall" && lvlCfg.storageCapacity) {
      maxGold += lvlCfg.storageCapacity;
      maxElixir += lvlCfg.storageCapacity;
    } else if (b.type === "gold_storage" && lvlCfg.storageCapacity) {
      maxGold += lvlCfg.storageCapacity;
    } else if (b.type === "elixir_storage" && lvlCfg.storageCapacity) {
      maxElixir += lvlCfg.storageCapacity;
    }
  }

  return { maxGold, maxElixir };
}

export function loadGameState(): GameState {
  if (typeof window === "undefined") return INITIAL_GAME_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_GAME_STATE;

    const parsed: GameState = JSON.parse(raw);
    const now = Date.now();
    const elapsedHours = Math.max(0, (now - parsed.lastUpdated) / (1000 * 3600));

    // Passive offline production update
    const updatedBuildings = parsed.buildings.map((b) => {
      const def = BUILDING_DEFINITIONS[b.type];
      const lvl = def?.levels[b.level];
      if (lvl?.productionRatePerHour) {
        const generated = Math.floor(elapsedHours * lvl.productionRatePerHour);
        const maxCap = lvl.storageCapacity || 500;
        const currentUncollected = b.uncollectedResources || 0;
        return {
          ...b,
          uncollectedResources: Math.min(maxCap, currentUncollected + generated),
          lastCollectedTime: now,
        };
      }
      return b;
    });

    // Check finished upgrades while offline
    const finalBuildings = updatedBuildings.map((b) => {
      if (b.isUpgrading && b.upgradeStartTime && b.upgradeDurationMs) {
        if (now >= b.upgradeStartTime + b.upgradeDurationMs) {
          return {
            ...b,
            level: b.level + 1,
            isUpgrading: false,
            upgradeStartTime: undefined,
            upgradeDurationMs: undefined,
          };
        }
      }
      return b;
    });

    const { maxGold, maxElixir } = recalculateCaps(finalBuildings);

    return {
      ...parsed,
      buildings: finalBuildings,
      resources: {
        ...parsed.resources,
        maxGold,
        maxElixir,
      },
      lastUpdated: now,
    };
  } catch (e) {
    console.error("Failed to load game state:", e);
    return INITIAL_GAME_STATE;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastUpdated: Date.now(),
      })
    );
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
}
