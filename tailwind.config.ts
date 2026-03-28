import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0f1629",
          "navy-mid": "#1a2340",
          "navy-light": "#232d4a",
          coral: "#e94560",
          blue: "#3b82f6",
          green: "#22c55e",
        },
        surface: { DEFAULT: "#161b2e", raised: "#1c2340" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
