import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coc: {
          gold: "#f59e0b",
          goldDark: "#b45309",
          elixir: "#d946ef",
          elixirDark: "#a21caf",
          gem: "#10b981",
          wood: "#854d0e",
          stone: "#475569",
          darkBg: "#0f172a",
          cardBg: "rgba(15, 23, 42, 0.88)",
          hudBorder: "#d97706",
        },
      },
      boxShadow: {
        coc: "0 4px 0 rgba(0, 0, 0, 0.35)",
        cocLg: "0 6px 0 rgba(0, 0, 0, 0.45)",
        cocGlow: "0 0 20px rgba(245, 158, 11, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
