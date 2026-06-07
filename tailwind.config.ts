import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2a23",
        pondok: "#16452f",
        leaf: "#2f7d4b",
        cream: "#f6f0df",
        bone: "#fffaf0",
        gold: "#b68a2c",
        clay: "#8a5a35",
        paper: "#fbf8ee"
      }
    }
  },
  plugins: []
};

export default config;
