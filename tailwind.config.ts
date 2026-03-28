import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Ideatech brand — from logo
          green: "#7AB929",
          "green-dark": "#5A9A10",
          "green-light": "#96D44A",
          blue: "#00AEEF",
          "blue-dark": "#0090C8",
          "blue-light": "#33C4FF",
          // UI foundations
          navy: "#0B1120",
          "navy-mid": "#111827",
          "navy-light": "#1F2937",
          coral: "#7AB929", // Primary CTA now matches Ideatech green
        },
        surface: { DEFAULT: "#111827", raised: "#1F2937" },
        accent: {
          green: "#7AB929",
          blue: "#00AEEF",
          red: "#EF4444",
          yellow: "#F59E0B",
          purple: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
