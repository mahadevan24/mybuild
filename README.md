# 🏰 GoalClash — Real-Life Goal Village Builder

> A 3D isometric village builder inspired by the building & upgrade mechanics of **Clash of Clans**, where every monument in your village mirrors your real-life progress on habits, coding, fitness, and learning.

Built with **Next.js 14**, **Three.js**, **Tailwind CSS**, and **Playwright**.

---

## 🌟 Concept: The Village of Ambition

In standard base builders, you grind virtual gold to upgrade arbitrary towers. In **GoalClash**, your village is a direct physical projection of your real-world personal growth:

- **Citadel of Purpose (Town Hall)**: The cornerstone of your village. Upgrading unlocks higher tier workshops, bonus XP multipliers, and new building caps.
- **Goal Shrines**:
  - **💻 Forge of Code**: Represents software engineering, project milestones, and coding practice. Logging coding hours grants Focus Gold, Willpower Gems, and **Sprint Boosts** that shave real-time construction minutes off all active village upgrades!
  - **🥋 Dojo of Strength**: Mirrors gym workouts, physical fitness, steps, and nutrition. Logging workouts pumps Vital Elixir and speeds up base builders.
  - **📚 Sanctum of Knowledge**: Mirrors reading books, studying system design, and algorithmic problem-solving.
  - **🧘 Temple of Mindfulness**: Promotes meditation, sleep hygiene, and mental tranquility, protecting daily streaks and granting willpower bonuses.
  - **🏹 Discipline Watchtower**: Fends off impulse procrastination and doomscrolling distractions, strengthening your streak resilience.
- **Economy & Storage**:
  - **⛏️ Focus Mine**: Digs deep into daily concentration, passively generating Focus Gold.
  - **🧪 Vital Energy Well**: Translucent bubbling vat harvesting Vital Elixir from healthy daily recovery.
  - **💰 Focus Vault & 🔮 Vitality Reservoir**: Expand your maximum resource holding capacities.
  - **🔨 Builder's Workshop**: Accommodates active builders needed to concurrently upgrade structures.

---

## 🎮 Game Mechanics

### 1. Building & Upgrade Lifecycle
- **Construction Timers**: Low levels construct in 15–30 seconds; higher tiers scale up. A real-time countdown progress bar is visible above buildings and on the action HUD.
- **Visual Tier Evolution**: Every single building level (1 through 5) features custom procedural 3D low-poly models (from wooden timber and thatched roofs to granite bastions, golden trim, glowing plasma conduits, and holographic cyber-monoliths).
- **Builder System**: Upgrading structures occupies a Builder Hut. Upgrade multiple buildings in parallel by constructing additional Builder Workshops.
- **Instant Finish (Gems)**: Spend Willpower Gems to rush active construction instantly with celebratory victory fanfare.

### 2. Real-World Goal Integration
- **Goal Nexus Dashboard**: Create, track, and categorize real-life goals (`Coding`, `Fitness`, `Knowledge`, `Mindfulness`, `General`).
- **Interactive Logging**: Log progress (`+1 Hour`, `+1 Workout`, `+25 Pages`) directly through the HUD or the building action bar.
- **Sprint Boost Mechanic**: Every logged session triggers a **Sprint Boost**, instantly deducting 15–45 minutes from all currently upgrading buildings in your base!
- **Milestone Fireworks**: Hitting your daily targets triggers victory chords, confetti fireworks, Willpower Gems, and boosts your daily streak.

### 3. Isometric 3D Engine (Three.js)
- **Controls**: Drag to pan across the 22x22 village terrain, scroll or use on-screen buttons to zoom in and out, and center with a single tap.
- **Smart Grid Placement**: Grid projection with real-time green (valid) and red (obstructed) hover indicators for placing new structures.
- **Web Audio FX**: Procedural synthesized audio effects for UI clicks, coin collections, stone/wood building placement thuds, builder hammer rhythms, and upgrade completion fanfares (works 100% offline with zero external sound files).
- **Persistent State**: Automated LocalStorage persistence with offline resource production calculation and JSON export/import for backups.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **3D Graphics**: [Three.js](https://threejs.org/) (Procedural low-poly isometric scene, soft shadow mapping, raycasting, and custom shaders)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Clash of Clans wooden/stone/golden UI aesthetic)
- **Testing**: [Playwright](https://playwright.dev/) (Comprehensive End-to-End test suite)
- **Visuals & Audio**: `canvas-confetti` & Web Audio API procedural synthesis

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- `pnpm` (or `npm` / `yarn`)

### Installation

```bash
# Clone the repository
git clone https://github.com/mahadevan24/mybuild.git
cd mybuild

# Install dependencies
pnpm install

# Install Playwright browser binaries (for tests)
pnpm exec playwright install chromium
```

### Running Locally

```bash
# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Create an optimized production build
pnpm build

# Start the production server
pnpm start
```

### Running End-to-End Tests

```bash
pnpm test:e2e
```

---

## 🏗️ Architecture & Project Structure

```
mybuild/
├── src/
│   ├── app/
│   │   ├── globals.css              # Custom styling, scrollbars & theme
│   │   ├── layout.tsx               # Root application layout
│   │   └── page.tsx                 # Core game state loop & HUD orchestrator
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── models.ts            # Procedural 3D models for all building tiers
│   │   │   └── VillageScene.tsx     # Isometric Three.js viewport & raycaster
│   │   └── hud/
│   │       ├── TopBar.tsx           # Resources, builders, streak & level HUD
│   │       ├── BuildingActionBar.tsx# Action bar for selected building
│   │       ├── ShopModal.tsx        # Building catalog & placement mode trigger
│   │       ├── GoalDashboardModal.tsx# Real-life goals tracker & sprint boost
│   │       ├── BuildingInfoModal.tsx# Building stats & tier preview modal
│   │       └── SettingsModal.tsx    # Audio toggle, demo boost & JSON export
│   ├── constants/
│   │   ├── buildings.ts             # Building definitions, costs & level configs
│   │   └── goals.ts                 # Real-life goal categories & defaults
│   ├── types/
│   │   └── game.ts                  # TypeScript definitions for base & goals
│   └── utils/
│       ├── audio.ts                 # Web Audio API sound synthesizer
│       └── storage.ts               # LocalStorage management & offline yields
├── tests/
│   └── game.spec.ts                 # Playwright E2E test suite
├── playwright.config.ts             # Playwright configuration
├── tailwind.config.ts               # Tailwind design system tokens
└── README.md
```

---

## 📜 License

MIT License. Crafted with ambition!
