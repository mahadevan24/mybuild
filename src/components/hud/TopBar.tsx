"use client";

import React from "react";
import { GameState, BuilderState } from "@/types/game";
import { sounds } from "@/utils/audio";
import { Sparkles, Hammer, Flame, ShoppingBag, Target, Settings as SettingsIcon } from "lucide-react";

interface TopBarProps {
  state: GameState;
  builderState: BuilderState;
  onOpenShop: () => void;
  onOpenGoals: () => void;
  onOpenSettings: () => void;
}

export default function TopBar({
  state,
  builderState,
  onOpenShop,
  onOpenGoals,
  onOpenSettings,
}: TopBarProps) {
  const { resources, playerStats } = state;
  const xpPercent = Math.min(100, Math.floor((playerStats.xp / playerStats.maxXp) * 100));

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-2 sm:p-4 flex flex-col gap-2">
      {/* Upper Status Row */}
      <div className="flex items-center justify-between w-full">
        {/* Left: Player Profile & Level */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-amber-600/50 rounded-xl p-1.5 sm:p-2 shadow-coc">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-300 text-slate-950 font-black text-lg shadow-inner">
            {playerStats.level}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold">
              ★
            </span>
          </div>

          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-amber-200 tracking-wide uppercase drop-shadow">
                Chief of Ambition
              </span>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                <Flame className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />
                {playerStats.streakDays}d
              </span>
            </div>

            {/* XP Bar */}
            <div className="w-24 sm:w-32 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700 relative mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-200 drop-shadow">
                {playerStats.xp} / {playerStats.maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Center: Builders Status */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-amber-600/40 rounded-xl px-2.5 py-1.5 shadow-coc">
          <div className="w-7 h-7 rounded-lg bg-amber-800/80 border border-amber-500 flex items-center justify-center text-amber-300">
            <Hammer className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Builders
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300">
              {builderState.total - builderState.busy} / {builderState.total} Free
            </span>
          </div>
        </div>

        {/* Right: Quick Action Modals (Goals, Shop, Settings) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenGoals();
            }}
            className="flex items-center gap-1.5 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm px-3 py-2 rounded-xl border border-blue-400 shadow-coc transition active:translate-y-0.5"
            title="Real-Life Goals"
          >
            <Target className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">Goals</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm px-3 py-2 rounded-xl border border-amber-400 shadow-coc transition active:translate-y-0.5"
            title="Shop / Buildings"
          >
            <ShoppingBag className="w-4 h-4 text-amber-200" />
            <span className="hidden sm:inline">Shop</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 shadow-coc transition active:scale-95"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lower Resources Row */}
      <div className="pointer-events-auto flex items-center justify-end gap-2 w-full flex-wrap sm:flex-nowrap">
        {/* Focus Gold Meter */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-amber-500/50 rounded-xl px-2.5 py-1 shadow-coc">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border border-yellow-200 flex items-center justify-center text-xs font-black text-amber-950 shadow">
            💰
          </div>
          <div className="flex flex-col min-w-[70px] sm:min-w-[90px]">
            <div className="flex justify-between items-baseline text-[11px] sm:text-xs font-black text-amber-300">
              <span>{resources.gold.toLocaleString()}</span>
              <span className="text-[9px] text-amber-500 font-semibold">
                /{resources.maxGold.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-amber-900">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                style={{ width: `${Math.min(100, (resources.gold / resources.maxGold) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vital Elixir Meter */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-fuchsia-500/50 rounded-xl px-2.5 py-1 shadow-coc">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-700 border border-fuchsia-200 flex items-center justify-center text-xs font-black text-fuchsia-950 shadow">
            🧪
          </div>
          <div className="flex flex-col min-w-[70px] sm:min-w-[90px]">
            <div className="flex justify-between items-baseline text-[11px] sm:text-xs font-black text-fuchsia-300">
              <span>{resources.elixir.toLocaleString()}</span>
              <span className="text-[9px] text-fuchsia-500 font-semibold">
                /{resources.maxElixir.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-purple-900">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (resources.elixir / resources.maxElixir) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Willpower Gems */}
        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-emerald-500/50 rounded-xl px-2.5 py-1 shadow-coc">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-700 border border-emerald-200 flex items-center justify-center text-xs font-black text-emerald-950 shadow">
            💎
          </div>
          <span className="text-xs sm:text-sm font-black text-emerald-300">
            {resources.gems.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
}
