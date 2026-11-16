"use client";

import React, { useState } from "react";
import { BuildingType, BuildingCategory, PlacedBuilding, Resources } from "@/types/game";
import { BUILDING_DEFINITIONS } from "@/constants/buildings";
import { sounds } from "@/utils/audio";
import { X, Hammer, Shield, Sparkles, Database, Check } from "lucide-react";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildings: PlacedBuilding[];
  resources: Resources;
  townHallLevel: number;
  onSelectBuildType: (type: BuildingType) => void;
}

export default function ShopModal({
  isOpen,
  onClose,
  buildings,
  resources,
  townHallLevel,
  onSelectBuildType,
}: ShopModalProps) {
  const [selectedTab, setSelectedTab] = useState<"all" | BuildingCategory>("all");

  if (!isOpen) return null;

  const buildingList = Object.values(BUILDING_DEFINITIONS);

  const filteredBuildings = buildingList.filter((b) => {
    if (selectedTab === "all") return true;
    return b.category === selectedTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-amber-600/80 rounded-3xl shadow-cocLg overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-600/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow">
              🏬
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wide uppercase drop-shadow">
                Village Architect Shop
              </h2>
              <p className="text-xs text-amber-400/80">
                Erect monuments that mirror your real-life discipline and goals
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "all", label: "All Buildings", icon: Sparkles },
            { id: "goals", label: "Goal Shrines", icon: Sparkles },
            { id: "resources", label: "Economy & Energy", icon: Database },
            { id: "defense", label: "Defense & Discipline", icon: Shield },
            { id: "core", label: "Core & Builders", icon: Hammer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border ${
                  isActive
                    ? "bg-amber-600 text-slate-950 border-amber-400 shadow-coc"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Building Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.map((def) => {
            const countPlaced = buildings.filter((b) => b.type === def.type).length;
            const maxAllowed = def.maxCount;
            const isCountMaxed = countPlaced >= maxAllowed;

            const lvl1 = def.levels[1];
            const canAfford =
              resources.gold >= lvl1.costGold &&
              resources.elixir >= lvl1.costElixir &&
              resources.gems >= lvl1.costGems;

            const isTownHallLocked = townHallLevel < lvl1.requiredTownHallLevel;
            const canBuild = !isCountMaxed && !isTownHallLocked && canAfford;

            return (
              <div
                key={def.type}
                className="flex flex-col justify-between bg-slate-800/70 border border-slate-700 hover:border-amber-500/60 rounded-2xl p-4 transition-all duration-200 shadow-coc"
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-extrabold text-amber-200 text-sm sm:text-base leading-tight">
                        {def.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {def.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isCountMaxed
                          ? "bg-rose-950/60 text-rose-300 border-rose-700/50"
                          : "bg-slate-900 text-amber-300 border-amber-600/40"
                      }`}
                    >
                      {countPlaced} / {maxAllowed}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {lvl1.description}
                  </p>

                  {/* Real Life Goal Synergy Callout */}
                  <div className="bg-amber-950/40 border border-amber-600/30 rounded-xl p-2.5 mb-3 text-[11px] text-amber-300">
                    <span className="font-black text-amber-400 block mb-0.5">
                      🌟 Life Goal Synergy:
                    </span>
                    {lvl1.goalBonusDescription}
                  </div>
                </div>

                {/* Footer Cost & Build Button */}
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {lvl1.costGold > 0 && (
                      <span className={resources.gold >= lvl1.costGold ? "text-amber-300" : "text-rose-400 font-extrabold"}>
                        💰 {lvl1.costGold.toLocaleString()}
                      </span>
                    )}
                    {lvl1.costElixir > 0 && (
                      <span className={resources.elixir >= lvl1.costElixir ? "text-fuchsia-300" : "text-rose-400 font-extrabold"}>
                        🧪 {lvl1.costElixir.toLocaleString()}
                      </span>
                    )}
                    {lvl1.costGems > 0 && (
                      <span className={resources.gems >= lvl1.costGems ? "text-emerald-300" : "text-rose-400 font-extrabold"}>
                        💎 {lvl1.costGems}
                      </span>
                    )}
                    {lvl1.costGold === 0 && lvl1.costElixir === 0 && lvl1.costGems === 0 && (
                      <span className="text-emerald-400 font-bold">Free</span>
                    )}
                  </div>

                  <button
                    disabled={!canBuild}
                    onClick={() => {
                      sounds.playClick();
                      onSelectBuildType(def.type);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition border shadow ${
                      canBuild
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400 active:scale-95"
                        : "bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isCountMaxed
                      ? "Limit Hit"
                      : isTownHallLocked
                      ? `Req. TH ${lvl1.requiredTownHallLevel}`
                      : "Build"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
