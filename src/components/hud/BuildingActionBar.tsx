"use client";

import React, { useEffect, useState } from "react";
import { PlacedBuilding, Resources, BuilderState, RealLifeGoal } from "@/types/game";
import { BUILDING_DEFINITIONS } from "@/constants/buildings";
import { sounds } from "@/utils/audio";
import { Info, ArrowUpCircle, Zap, CheckCircle2, X, PlusCircle, Coins } from "lucide-react";

interface BuildingActionBarProps {
  building: PlacedBuilding | null;
  resources: Resources;
  builderState: BuilderState;
  goals: RealLifeGoal[];
  onUpgrade: (buildingId: string) => void;
  onInstantFinish: (buildingId: string) => void;
  onOpenInfo: (building: PlacedBuilding) => void;
  onOpenGoalLog: (goalId: string) => void;
  onCollect: (buildingId: string) => void;
  onClose: () => void;
}

export default function BuildingActionBar({
  building,
  resources,
  builderState,
  goals,
  onUpgrade,
  onInstantFinish,
  onOpenInfo,
  onOpenGoalLog,
  onCollect,
  onClose,
}: BuildingActionBarProps) {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  useEffect(() => {
    if (!building?.isUpgrading || !building.upgradeStartTime || !building.upgradeDurationMs) {
      setTimeLeftStr("");
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const end = building.upgradeStartTime! + building.upgradeDurationMs!;
      const diffMs = Math.max(0, end - now);
      const totalSecs = Math.ceil(diffMs / 1000);

      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setTimeLeftStr(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    }, 250);

    return () => clearInterval(interval);
  }, [building]);

  if (!building) return null;

  const def = BUILDING_DEFINITIONS[building.type];
  if (!def) return null;

  const isMaxLevel = building.level >= def.maxLevel;
  const nextLevelCfg = !isMaxLevel ? def.levels[building.level + 1] : null;

  const canAffordUpgrade = nextLevelCfg
    ? resources.gold >= nextLevelCfg.costGold &&
      resources.elixir >= nextLevelCfg.costElixir &&
      builderState.busy < builderState.total
    : false;

  // Gem cost to finish instant upgrade based on remaining time
  const gemFinishCost = building.isUpgrading ? 5 : 0;

  // Find linked goal
  const linkedGoal = goals.find(
    (g) =>
      building.linkedGoalIds?.includes(g.id) ||
      (def.goalCategory && g.category === def.goalCategory)
  );

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/70 rounded-2xl shadow-cocLg p-3 sm:p-4 text-white">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-950 border border-amber-500 text-lg sm:text-xl shadow">
              {building.type === "town_hall" && "🏰"}
              {building.type === "gold_mine" && "⛏️"}
              {building.type === "elixir_collector" && "🧪"}
              {building.type === "gold_storage" && "💰"}
              {building.type === "elixir_storage" && "🔮"}
              {building.type === "builder_hut" && "🔨"}
              {building.type === "forge_of_code" && "💻"}
              {building.type === "dojo_of_strength" && "🥋"}
              {building.type === "sanctum_of_knowledge" && "📚"}
              {building.type === "temple_of_mindfulness" && "🧘"}
              {building.type === "archer_tower" && "🏹"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-amber-200 tracking-wide">
                  {def.name}
                </h3>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/40">
                  Lvl {building.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {def.levels[building.level]?.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Deselect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upgrade in Progress Countdown Banner */}
        {building.isUpgrading && (
          <div className="mb-3 bg-amber-950/60 border border-amber-600/40 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-200">
                Upgrading to Level {building.level + 1}... Time Left:{" "}
                <span className="text-amber-400 font-mono font-black">{timeLeftStr}</span>
              </span>
            </div>

            <button
              onClick={() => {
                if (resources.gems >= gemFinishCost) {
                  sounds.playUpgradeComplete();
                  onInstantFinish(building.id);
                } else {
                  sounds.playError();
                }
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-400 shadow transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Finish ({gemFinishCost} 💎)
            </button>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Info Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenInfo(building);
            }}
            className="flex-1 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl py-2 px-3 border border-slate-600 text-xs font-bold transition shadow"
          >
            <Info className="w-4 h-4 mb-0.5 text-blue-400" />
            Info
          </button>

          {/* Collect Button (Mines / Collectors) */}
          {building.uncollectedResources && building.uncollectedResources > 0 ? (
            <button
              onClick={() => {
                sounds.playCollect();
                onCollect(building.id);
              }}
              className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-500 to-amber-700 hover:from-yellow-400 hover:to-amber-600 text-slate-950 font-black rounded-xl py-2 px-3 border border-yellow-300 text-xs transition shadow animate-pulse"
            >
              <Coins className="w-4 h-4 mb-0.5" />
              Collect (+{building.uncollectedResources})
            </button>
          ) : null}

          {/* Log Goal Progress Shortcut */}
          {linkedGoal && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenGoalLog(linkedGoal.id);
              }}
              className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 to-indigo-900 hover:from-blue-600 hover:to-indigo-800 text-cyan-200 rounded-xl py-2 px-3 border border-blue-400 text-xs font-bold transition shadow"
            >
              <PlusCircle className="w-4 h-4 mb-0.5 text-cyan-300" />
              Log Goal
            </button>
          )}

          {/* Upgrade Button */}
          {!building.isUpgrading && !isMaxLevel && nextLevelCfg && (
            <button
              disabled={!canAffordUpgrade}
              onClick={() => {
                if (canAffordUpgrade) {
                  sounds.playHammer();
                  onUpgrade(building.id);
                } else {
                  sounds.playError();
                }
              }}
              className={`flex-[1.4] flex flex-col items-center justify-center rounded-xl py-2 px-3 text-xs font-black transition border shadow ${
                canAffordUpgrade
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white border-emerald-400 active:scale-95"
                  : "bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowUpCircle className="w-4 h-4 text-emerald-300" />
                <span>Upgrade to Lvl {building.level + 1}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                {nextLevelCfg.costGold > 0 && (
                  <span className={resources.gold >= nextLevelCfg.costGold ? "text-amber-300" : "text-rose-400"}>
                    💰 {nextLevelCfg.costGold.toLocaleString()}
                  </span>
                )}
                {nextLevelCfg.costElixir > 0 && (
                  <span className={resources.elixir >= nextLevelCfg.costElixir ? "text-fuchsia-300" : "text-rose-400"}>
                    🧪 {nextLevelCfg.costElixir.toLocaleString()}
                  </span>
                )}
                <span className="text-slate-400">⏱️ {nextLevelCfg.buildTimeSeconds}s</span>
              </div>
            </button>
          )}

          {isMaxLevel && (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/60 text-amber-400 rounded-xl py-2 px-3 border border-amber-600/30 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 mb-0.5" />
              Max Level Reached!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
