import type { Config } from "tailwindcss";

// Colour families read CSS variables from src/app/theme.css, so html.dark flips the
// whole app to dark mode without per-component dark: classes.
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const family = (name: string) => Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: family("slate"),
        green: family("green"),
        red: family("red"),
        amber: family("amber"),
        sky: family("sky"),
        violet: family("violet"),
        teal: family("teal"),
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", fg: "rgb(var(--ink-fg) / <alpha-value>)" },
        brand: { DEFAULT: "#0f766e", dark: "#115e59", light: "#ccfbf1" },
        allow: "#15803d",
        warn: "#b45309",
        deny: "#b91c1c",
        exit: "#0369a1",
      },
      keyframes: {
        drift: { "0%": { transform: "translate(-30%, -30%) rotate(-20deg)" }, "100%": { transform: "translate(0%, 0%) rotate(-20deg)" } },
        hue: { "0%": { filter: "hue-rotate(0deg)" }, "100%": { filter: "hue-rotate(360deg)" } },
        pulse_ring: { "0%": { transform: "scale(0.9)", opacity: "1" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
        slide_in: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(0)" } },
        fade_in: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        drift: "drift 12s linear infinite alternate",
        hue: "hue 20s linear infinite",
        pulse_ring: "pulse_ring 1.5s ease-out infinite",
        slide_in: "slide_in 180ms ease-out",
        fade_in: "fade_in 180ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
