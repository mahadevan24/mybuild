"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  GameState,
  PlacedBuilding,
  BuildingType,
  RealLifeGoal,
  BuilderState,
} from "@/types/game";
import {
  loadGameState,
  saveGameState,
  recalculateCaps,
  INITIAL_GAME_STATE,
} from "@/utils/storage";
import { BUILDING_DEFINITIONS, GRID_SIZE } from "@/constants/buildings";
import { sounds } from "@/utils/audio";
import TopBar from "@/components/hud/TopBar";
import BuildingActionBar from "@/components/hud/BuildingActionBar";
import ShopModal from "@/components/hud/ShopModal";
import GoalDashboardModal from "@/components/hud/GoalDashboardModal";
import BuildingInfoModal from "@/components/hud/BuildingInfoModal";
import SettingsModal from "@/components/hud/SettingsModal";
import confetti from "canvas-confetti";
import { X, ShieldAlert } from "lucide-react";

// Dynamically import 3D Canvas to guarantee client-only Three.js rendering
const VillageScene = dynamic(() => import("@/components/canvas/VillageScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-amber-300 font-black">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-base tracking-widest uppercase animate-pulse">
        Generating 3D Village of Ambition...
      </span>
    </div>
  ),
});

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);

  // Selected Building
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Placement Mode
  const [placementMode, setPlacementMode] = useState<{
    active: boolean;
    buildingType: BuildingType | null;
  }>({
    active: false,
    buildingType: null,
  });

  // Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [infoModalBuilding, setInfoModalBuilding] = useState<PlacedBuilding | null>(null);

  // Initial load
  useEffect(() => {
    const loaded = loadGameState();
    setGameState(loaded);
    sounds.setEnabled(loaded.soundEnabled);
    setMounted(true);
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (mounted) {
      saveGameState(gameState);
    }
  }, [gameState, mounted]);

  // Selected building object
  const selectedBuilding = useMemo(() => {
    if (!selectedBuildingId) return null;
    return gameState.buildings.find((b) => b.id === selectedBuildingId) || null;
  }, [selectedBuildingId, gameState.buildings]);

  // Town Hall Level
  const townHallLevel = useMemo(() => {
    const th = gameState.buildings.find((b) => b.type === "town_hall");
    return th?.level || 1;
  }, [gameState.buildings]);

  // Builders calculation
  const builderState: BuilderState = useMemo(() => {
    const builderHuts = gameState.buildings.filter((b) => b.type === "builder_hut");
    const total = Math.max(1, builderHuts.length);
    const busy = gameState.buildings.filter((b) => b.isUpgrading).length;
    return { total, busy };
  }, [gameState.buildings]);

  // Main game tick: Upgrades timer & passive resource production
  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      let newBuildings = [...gameState.buildings];
      let gainedXp = 0;

      // 1. Check Construction Timers
      newBuildings = newBuildings.map((b) => {
        if (b.isUpgrading && b.upgradeStartTime && b.upgradeDurationMs) {
          if (now >= b.upgradeStartTime + b.upgradeDurationMs) {
            hasChanges = true;
            gainedXp += b.level * 50;

            // Upgrade complete fanfare & confetti
            sounds.playUpgradeComplete();
            try {
              confetti({
                particleCount: 60,
                spread: 60,
                origin: { y: 0.5 },
              });
            } catch (e) {}

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

      // 2. Passive Resource Generation for mines/collectors
      newBuildings = newBuildings.map((b) => {
        const def = BUILDING_DEFINITIONS[b.type];
        const lvl = def?.levels[b.level];
        if (lvl?.productionRatePerHour) {
          const perSec = lvl.productionRatePerHour / 3600;
          const current = b.uncollectedResources || 0;
          const maxCap = lvl.storageCapacity || 500;
          if (current < maxCap) {
            hasChanges = true;
            return {
              ...b,
              uncollectedResources: Math.min(maxCap, current + perSec * 2), // 2s per tick
            };
          }
        }
        return b;
      });

      if (hasChanges) {
        const { maxGold, maxElixir } = recalculateCaps(newBuildings);

        setGameState((prev) => {
          let newXp = prev.playerStats.xp + gainedXp;
          let newLvl = prev.playerStats.level;
          let newMaxXp = prev.playerStats.maxXp;

          if (newXp >= newMaxXp) {
            newXp -= newMaxXp;
            newLvl += 1;
            newMaxXp = Math.floor(newMaxXp * 1.5);
            sounds.playUpgradeComplete();
          }

          return {
            ...prev,
            buildings: newBuildings,
            resources: {
              ...prev.resources,
              maxGold,
              maxElixir,
            },
            playerStats: {
              ...prev.playerStats,
              level: newLvl,
              xp: newXp,
              maxXp: newMaxXp,
            },
            lastUpdated: now,
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mounted, gameState.buildings]);

  // Action: Upgrade Building
  const handleUpgrade = (buildingId: string) => {
    const b = gameState.buildings.find((x) => x.id === buildingId);
    if (!b || b.isUpgrading) return;

    const def = BUILDING_DEFINITIONS[b.type];
    const nextCfg = def.levels[b.level + 1];
    if (!nextCfg) return;

    if (
      gameState.resources.gold < nextCfg.costGold ||
      gameState.resources.elixir < nextCfg.costElixir ||
      builderState.busy >= builderState.total
    ) {
      sounds.playError();
      return;
    }

    setGameState((prev) => {
      const updatedBuildings = prev.buildings.map((item) => {
        if (item.id === buildingId) {
          return {
            ...item,
            isUpgrading: true,
            upgradeStartTime: Date.now(),
            upgradeDurationMs: nextCfg.buildTimeSeconds * 1000,
          };
        }
        return item;
      });

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gold: prev.resources.gold - nextCfg.costGold,
          elixir: prev.resources.elixir - nextCfg.costElixir,
        },
        buildings: updatedBuildings,
      };
    });
  };

  // Action: Instant Finish with Gems
  const handleInstantFinish = (buildingId: string) => {
    const b = gameState.buildings.find((x) => x.id === buildingId);
    if (!b || !b.isUpgrading) return;

    const gemCost = 5;
    if (gameState.resources.gems < gemCost) {
      sounds.playError();
      return;
    }

    setGameState((prev) => {
      const updatedBuildings = prev.buildings.map((item) => {
        if (item.id === buildingId) {
          return {
            ...item,
            level: item.level + 1,
            isUpgrading: false,
            upgradeStartTime: undefined,
            upgradeDurationMs: undefined,
          };
        }
        return item;
      });

      const { maxGold, maxElixir } = recalculateCaps(updatedBuildings);

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gems: prev.resources.gems - gemCost,
          maxGold,
          maxElixir,
        },
        buildings: updatedBuildings,
        playerStats: {
          ...prev.playerStats,
          xp: prev.playerStats.xp + b.level * 60,
        },
      };
    });
  };

  // Action: Collect Unharvested Mine/Collector Resources
  const handleCollectResource = (buildingId: string) => {
    const b = gameState.buildings.find((x) => x.id === buildingId);
    if (!b || !b.uncollectedResources || b.uncollectedResources <= 0) return;

    const amount = Math.floor(b.uncollectedResources);

    setGameState((prev) => {
      let newGold = prev.resources.gold;
      let newElixir = prev.resources.elixir;

      if (b.type === "gold_mine") {
        newGold = Math.min(prev.resources.maxGold, newGold + amount);
      } else if (b.type === "elixir_collector") {
        newElixir = Math.min(prev.resources.maxElixir, newElixir + amount);
      }

      const updatedBuildings = prev.buildings.map((item) => {
        if (item.id === buildingId) {
          return { ...item, uncollectedResources: 0 };
        }
        return item;
      });

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gold: newGold,
          elixir: newElixir,
        },
        buildings: updatedBuildings,
      };
    });
  };

  // Action: Place New Building from Shop
  const handlePlaceBuilding = (x: number, z: number) => {
    if (!placementMode.buildingType) return;

    const def = BUILDING_DEFINITIONS[placementMode.buildingType];
    const lvl1 = def.levels[1];

    if (
      gameState.resources.gold < lvl1.costGold ||
      gameState.resources.elixir < lvl1.costElixir ||
      gameState.resources.gems < lvl1.costGems
    ) {
      sounds.playError();
      return;
    }

    const newBuilding: PlacedBuilding = {
      id: `${placementMode.buildingType}-${Date.now()}`,
      type: placementMode.buildingType,
      level: 1,
      x,
      z,
      uncollectedResources: 0,
      lastCollectedTime: Date.now(),
    };

    setGameState((prev) => {
      const newBuildings = [...prev.buildings, newBuilding];
      const { maxGold, maxElixir } = recalculateCaps(newBuildings);

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gold: prev.resources.gold - lvl1.costGold,
          elixir: prev.resources.elixir - lvl1.costElixir,
          gems: prev.resources.gems - lvl1.costGems,
          maxGold,
          maxElixir,
        },
        buildings: newBuildings,
      };
    });

    setPlacementMode({ active: false, buildingType: null });
    setSelectedBuildingId(newBuilding.id);
  };

  // Action: Real-Life Goal Logging with Sprint Boost!
  const handleLogGoalProgress = (goalId: string, amount: number) => {
    setGameState((prev) => {
      let bonusGold = 0;
      let bonusElixir = 0;
      let bonusGems = 0;
      let bonusXp = 0;
      let timerReductionSecs = 0;

      const updatedGoals = prev.goals.map((g) => {
        if (g.id === goalId) {
          const newProg = g.currentProgress + amount;
          const wasCompleted = g.completed;
          const isNowCompleted = newProg >= g.targetProgress;

          bonusGold = g.rewardGold;
          bonusElixir = g.rewardElixir;
          bonusGems = isNowCompleted && !wasCompleted ? g.rewardGems : 3;
          bonusXp = g.rewardXp;
          timerReductionSecs = (g.timerReductionMinutes || 15) * 60;

          return {
            ...g,
            currentProgress: newProg,
            completed: isNowCompleted,
            streakDays: g.streakDays + (isNowCompleted && !wasCompleted ? 1 : 0),
          };
        }
        return g;
      });

      // Apply Sprint Boost: subtract time from all active upgrading buildings!
      const reductionMs = timerReductionSecs * 1000;
      const updatedBuildings = prev.buildings.map((b) => {
        if (b.isUpgrading && b.upgradeStartTime) {
          return {
            ...b,
            upgradeStartTime: b.upgradeStartTime - reductionMs,
          };
        }
        return b;
      });

      let newXp = prev.playerStats.xp + bonusXp;
      let newLvl = prev.playerStats.level;
      let newMaxXp = prev.playerStats.maxXp;

      if (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLvl += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5);
      }

      return {
        ...prev,
        goals: updatedGoals,
        buildings: updatedBuildings,
        resources: {
          ...prev.resources,
          gold: Math.min(prev.resources.maxGold, prev.resources.gold + bonusGold),
          elixir: Math.min(prev.resources.maxElixir, prev.resources.elixir + bonusElixir),
          gems: prev.resources.gems + bonusGems,
        },
        playerStats: {
          ...prev.playerStats,
          level: newLvl,
          xp: newXp,
          maxXp: newMaxXp,
          goalsCompletedTotal: prev.playerStats.goalsCompletedTotal + 1,
          hoursInvestedTotal: prev.playerStats.hoursInvestedTotal + 1,
        },
      };
    });
  };

  const handleCreateGoal = (newGoalData: Omit<RealLifeGoal, "id" | "completed" | "streakDays">) => {
    const newGoal: RealLifeGoal = {
      ...newGoalData,
      id: `custom-goal-${Date.now()}`,
      completed: false,
      streakDays: 1,
    };

    setGameState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGameState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  };

  // Demo Boost helper
  const handleAddDemoResources = () => {
    setGameState((prev) => ({
      ...prev,
      resources: {
        ...prev.resources,
        gold: Math.min(prev.resources.maxGold, prev.resources.gold + 5000),
        elixir: Math.min(prev.resources.maxElixir, prev.resources.elixir + 5000),
        gems: prev.resources.gems + 100,
      },
    }));
  };

  const handleResetVillage = () => {
    setGameState(INITIAL_GAME_STATE);
    setSelectedBuildingId(null);
  };

  if (!mounted) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-amber-400">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-extrabold text-sm uppercase tracking-wider">
          Initializing GoalClash Engine...
        </p>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 3D Isometric Village Canvas */}
      <VillageScene
        buildings={gameState.buildings}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={(b) => setSelectedBuildingId(b ? b.id : null)}
        placementMode={placementMode}
        onPlaceBuilding={handlePlaceBuilding}
        onCollectResource={handleCollectResource}
      />

      {/* Top HUD Bar */}
      <TopBar
        state={gameState}
        builderState={builderState}
        onOpenShop={() => {
          setSelectedBuildingId(null);
          setIsShopOpen(true);
        }}
        onOpenGoals={() => {
          setSelectedBuildingId(null);
          setIsGoalsOpen(true);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
        }}
      />

      {/* Placement Mode Helper Banner */}
      {placementMode.active && placementMode.buildingType && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-amber-950/90 backdrop-blur-md border-2 border-amber-500 rounded-2xl px-5 py-2.5 shadow-cocLg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs sm:text-sm font-extrabold text-amber-200">
            Click any empty green grass tile to construct{" "}
            <span className="text-white underline">
              {BUILDING_DEFINITIONS[placementMode.buildingType]?.name}
            </span>
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              setPlacementMode({ active: false, buildingType: null });
            }}
            className="ml-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-lg border border-slate-600 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected Building Action Bar */}
      <BuildingActionBar
        building={selectedBuilding}
        resources={gameState.resources}
        builderState={builderState}
        goals={gameState.goals}
        onUpgrade={handleUpgrade}
        onInstantFinish={handleInstantFinish}
        onOpenInfo={(b) => setInfoModalBuilding(b)}
        onOpenGoalLog={(goalId) => {
          setIsGoalsOpen(true);
        }}
        onCollect={handleCollectResource}
        onClose={() => setSelectedBuildingId(null)}
      />

      {/* Modals */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        buildings={gameState.buildings}
        resources={gameState.resources}
        townHallLevel={townHallLevel}
        onSelectBuildType={(type) => {
          setSelectedBuildingId(null);
          setPlacementMode({ active: true, buildingType: type });
        }}
      />

      <GoalDashboardModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={gameState.goals}
        onLogGoalProgress={handleLogGoalProgress}
        onCreateGoal={handleCreateGoal}
        onDeleteGoal={handleDeleteGoal}
      />

      <BuildingInfoModal
        building={infoModalBuilding}
        onClose={() => setInfoModalBuilding(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={gameState.soundEnabled}
        onToggleSound={() => {
          const newVal = !gameState.soundEnabled;
          sounds.setEnabled(newVal);
          setGameState((prev) => ({ ...prev, soundEnabled: newVal }));
        }}
        onResetVillage={handleResetVillage}
        onAddDemoResources={handleAddDemoResources}
        state={gameState}
        onImportState={(newState) => {
          setGameState(newState);
          setSelectedBuildingId(null);
        }}
      />
    </main>
  );
}
