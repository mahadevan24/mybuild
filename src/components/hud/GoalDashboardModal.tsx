"use client";

import React, { useState } from "react";
import { RealLifeGoal, GoalCategory, BuildingType } from "@/types/game";
import { GOAL_CATEGORY_INFO } from "@/constants/goals";
import { sounds } from "@/utils/audio";
import confetti from "canvas-confetti";
import {
  X,
  Target,
  Plus,
  CheckCircle,
  Flame,
  Zap,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  Code2,
  Dumbbell,
  Heart,
} from "lucide-react";

interface GoalDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: RealLifeGoal[];
  onLogGoalProgress: (goalId: string, amount: number) => void;
  onCreateGoal: (newGoal: Omit<RealLifeGoal, "id" | "completed" | "streakDays">) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalDashboardModal({
  isOpen,
  onClose,
  goals,
  onLogGoalProgress,
  onCreateGoal,
  onDeleteGoal,
}: GoalDashboardModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | GoalCategory>("all");
  const [showAddForm, setShowAddForm] = useState(false);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<GoalCategory>("coding");
  const [newMetric, setNewMetric] = useState("Hours");
  const [newTarget, setNewTarget] = useState(3);

  if (!isOpen) return null;

  const filteredGoals = goals.filter((g) => {
    if (selectedFilter === "all") return true;
    return g.category === selectedFilter;
  });

  const handleLogProgress = (goal: RealLifeGoal, amount: number) => {
    onLogGoalProgress(goal.id, amount);

    const willComplete = goal.currentProgress + amount >= goal.targetProgress;
    if (willComplete) {
      sounds.playGoalCelebration();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899"],
        });
      } catch (e) {
        // Safe fallback
      }
    } else {
      sounds.playCollect();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onCreateGoal({
      title: newTitle.trim(),
      category: newCategory,
      targetMetric: newMetric,
      currentProgress: 0,
      targetProgress: Math.max(1, newTarget),
      associatedBuildingType: GOAL_CATEGORY_INFO[newCategory].buildingType,
      rewardGold: 750,
      rewardElixir: 750,
      rewardGems: 15,
      rewardXp: 120,
      timerReductionMinutes: 30,
    });

    setNewTitle("");
    setShowAddForm(false);
    sounds.playUpgradeComplete();
  };

  const getCategoryIcon = (category: GoalCategory) => {
    switch (category) {
      case "coding":
        return Code2;
      case "fitness":
        return Dumbbell;
      case "knowledge":
        return BookOpen;
      case "mindfulness":
        return Heart;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-blue-500/80 rounded-3xl shadow-cocLg overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-2xl shadow">
              🎯
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-cyan-200 tracking-wide uppercase drop-shadow">
                Real-Life Goal Nexus
              </h2>
              <p className="text-xs text-blue-300/80">
                Turn your real-world study, fitness, and coding into village power & instant builder speed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-emerald-400 shadow-coc transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? "Cancel" : "Add Goal"}</span>
            </button>

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
        </div>

        {/* Add Goal Collapsible Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 sm:p-5 bg-slate-950 border-b border-blue-900/60 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200"
          >
            <h3 className="font-extrabold text-sm text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Manifest New Real-Life Goal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Goal Title / Habit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build authentication in Next.js, 5km morning run..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Life Domain
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => {
                    const cat = e.target.value as GoalCategory;
                    setNewCategory(cat);
                    setNewMetric(GOAL_CATEGORY_INFO[cat].defaultMetric);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="coding">Coding & Software</option>
                  <option value="fitness">Fitness & Body</option>
                  <option value="knowledge">Study & Books</option>
                  <option value="mindfulness">Mindfulness & Sleep</option>
                  <option value="general">Discipline & Life</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Target Units ({newMetric})
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value)}
                  placeholder="Hours / Pages / Reps"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs py-2 px-4 rounded-xl border border-blue-400 shadow transition active:scale-95"
                >
                  Create & Link to Village
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/50 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "all", label: "All Real-Life Goals" },
            { id: "coding", label: "Coding & Software" },
            { id: "fitness", label: "Fitness & Health" },
            { id: "knowledge", label: "Books & Study" },
            { id: "mindfulness", label: "Mindfulness" },
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedFilter(tab.id as any);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-400 shadow-coc"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Goals List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Target className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-bold">No goals in this category yet.</p>
              <p className="text-xs text-slate-500">
                Click "+ Add Goal" above to create habits that mirror into your base!
              </p>
            </div>
          ) : (
            filteredGoals.map((g) => {
              const Icon = getCategoryIcon(g.category);
              const percent = Math.min(100, Math.floor((g.currentProgress / g.targetProgress) * 100));
              const isDone = g.currentProgress >= g.targetProgress;

              return (
                <div
                  key={g.id}
                  className={`border rounded-2xl p-4 transition-all duration-200 shadow-coc flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? "bg-emerald-950/30 border-emerald-600/50"
                      : "bg-slate-800/80 border-slate-700 hover:border-blue-500/50"
                  }`}
                >
                  {/* Left Column: Title & Progress Bar */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-300">
                        <Icon className="w-3 h-3 text-cyan-400" />
                        {g.category}
                      </span>

                      {g.streakDays > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-600/30">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          {g.streakDays} Day Streak
                        </span>
                      )}

                      {isDone && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          <CheckCircle className="w-3 h-3" />
                          Goal Completed!
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-white text-sm sm:text-base mb-1">
                      {g.title}
                    </h4>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700 relative">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isDone
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : "bg-gradient-to-r from-blue-500 to-cyan-400"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 whitespace-nowrap">
                        {g.currentProgress} / {g.targetProgress} {g.targetMetric}
                      </span>
                    </div>

                    {/* Village Rewards / Sprint Boost Preview */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-300 flex-wrap">
                      <span className="text-amber-300">💰 +{g.rewardGold}</span>
                      <span className="text-fuchsia-300">🧪 +{g.rewardElixir}</span>
                      <span className="text-emerald-300">💎 +{g.rewardGems}</span>
                      <span className="text-cyan-300 flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        -{g.timerReductionMinutes}m Builder Speedup
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Log Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleLogProgress(g, 1)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl border border-blue-400 shadow-coc transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log +1 {g.targetMetric.slice(0, 5)}</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        onDeleteGoal(g.id);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Delete Goal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
