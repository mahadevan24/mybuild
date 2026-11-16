"use client";

import React, { useState } from "react";
import { GameState } from "@/types/game";
import { sounds } from "@/utils/audio";
import { X, Volume2, VolumeX, RotateCcw, Download, Upload, Sparkles } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetVillage: () => void;
  onAddDemoResources: () => void;
  state: GameState;
  onImportState: (newState: GameState) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  onResetVillage,
  onAddDemoResources,
  state,
  onImportState,
}: SettingsModalProps) {
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `goalclash_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sounds.playCollect();
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.buildings && parsed.resources) {
        onImportState(parsed);
        setShowImport(false);
        sounds.playUpgradeComplete();
      } else {
        alert("Invalid save file structure");
      }
    } catch (e) {
      alert("Failed to parse JSON save file");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-cocLg overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <h2 className="text-lg font-black text-amber-200 tracking-wide uppercase">
            Village Settings
          </h2>
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

        {/* Options */}
        <div className="p-6 flex flex-col gap-3">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-amber-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <span className="font-extrabold text-sm block">Sound Effects</span>
                <span className="text-[11px] text-slate-400">Synthesized game audio</span>
              </div>
            </div>

            <button
              onClick={() => {
                onToggleSound();
                sounds.playClick();
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                soundEnabled ? "bg-amber-500 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Demo Resources Boost */}
          <button
            onClick={() => {
              sounds.playCollect();
              onAddDemoResources();
            }}
            className="flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-2xl border border-amber-500/30 text-left transition"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <div>
                <span className="font-extrabold text-sm block text-amber-200">
                  Demo Fast-Track Boost
                </span>
                <span className="text-[11px] text-slate-400">
                  Instant +5,000 Gold, +5,000 Elixir, +100 Gems
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-500/40">
              Claim
            </span>
          </button>

          {/* Backup / Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-2xl border border-slate-700 text-left transition"
          >
            <Download className="w-5 h-5 text-blue-400" />
            <div>
              <span className="font-extrabold text-sm block text-white">
                Export Save File
              </span>
              <span className="text-[11px] text-slate-400">
                Download your base & goals as JSON
              </span>
            </div>
          </button>

          {/* Import Save */}
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-2xl border border-slate-700 text-left transition"
          >
            <Upload className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-extrabold text-sm block text-white">
                Import Save File
              </span>
              <span className="text-[11px] text-slate-400">
                Restore base from previous JSON backup
              </span>
            </div>
          </button>

          {showImport && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-700 flex flex-col gap-2">
              <textarea
                rows={3}
                placeholder="Paste backup JSON string here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={handleImportSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition"
              >
                Confirm Import
              </button>
            </div>
          )}

          {/* Reset Progress */}
          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset your village to default?")) {
                sounds.playError();
                onResetVillage();
                onClose();
              }
            }}
            className="flex items-center gap-3 bg-rose-950/40 hover:bg-rose-950/70 p-3.5 rounded-2xl border border-rose-800/50 text-left transition"
          >
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <div>
              <span className="font-extrabold text-sm block text-rose-300">
                Reset Village
              </span>
              <span className="text-[11px] text-rose-400/70">
                Clear all custom buildings and restart
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
