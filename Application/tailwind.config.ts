import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0f766e", dark: "#115e59", light: "#ccfbf1" },
        allow: "#15803d",
        warn: "#b45309",
        deny: "#b91c1c",
      },
      keyframes: {
        drift: { "0%": { transform: "translate(-30%, -30%) rotate(-20deg)" }, "100%": { transform: "translate(0%, 0%) rotate(-20deg)" } },
        hue: { "0%": { filter: "hue-rotate(0deg)" }, "100%": { filter: "hue-rotate(360deg)" } },
        pulse_ring: { "0%": { transform: "scale(0.9)", opacity: "1" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
      },
      animation: {
        drift: "drift 12s linear infinite alternate",
        hue: "hue 20s linear infinite",
        pulse_ring: "pulse_ring 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
