"use client";

import React from "react";
import { PlacedBuilding } from "@/types/game";
import { BUILDING_DEFINITIONS } from "@/constants/buildings";
import { sounds } from "@/utils/audio";
import { X, ArrowRight, ShieldCheck, Zap, Database, Hammer } from "lucide-react";

interface BuildingInfoModalProps {
  building: PlacedBuilding | null;
  onClose: () => void;
}

export default function BuildingInfoModal({ building, onClose }: BuildingInfoModalProps) {
  if (!building) return null;

  const def = BUILDING_DEFINITIONS[building.type];
  if (!def) return null;

  const currentCfg = def.levels[building.level];
  const nextCfg = building.level < def.maxLevel ? def.levels[building.level + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-600/80 rounded-3xl shadow-cocLg overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-600/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow">
              🏰
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wide">
                {def.name}
              </h2>
              <span className="text-xs text-amber-400/80 font-bold">
                Level {building.level} of {def.maxLevel}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">
              Current Specifications
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed mb-3">
              {currentCfg?.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {currentCfg?.productionRatePerHour ? (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 flex flex-col">
                  <span className="text-[10px] text-slate-400">Production Rate</span>
                  <span className="text-amber-300 font-extrabold">
                    +{currentCfg.productionRatePerHour} / hr
                  </span>
                </div>
              ) : null}

              {currentCfg?.storageCapacity ? (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 flex flex-col">
                  <span className="text-[10px] text-slate-400">Capacity</span>
                  <span className="text-fuchsia-300 font-extrabold">
                    {currentCfg.storageCapacity.toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Goal Synergy Benefit */}
          <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h4 className="text-xs uppercase font-black text-amber-300 tracking-wider">
                Real-World Goal Synergy
              </h4>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              {currentCfg?.goalBonusDescription}
            </p>
          </div>

          {/* Next Level Progression Preview */}
          {nextCfg ? (
            <div className="bg-slate-800/50 border border-emerald-600/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Upgrade to Level {building.level + 1}
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  ⏱️ {nextCfg.buildTimeSeconds}s Construction
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">{nextCfg.description}</p>
              <div className="text-[11px] text-emerald-300 font-medium">
                ★ <span className="font-bold">Next perk:</span> {nextCfg.goalBonusDescription}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-amber-500/30 rounded-2xl p-3 text-center text-xs font-bold text-amber-400">
              🏆 Peak Evolution Achieved for this Monument!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
