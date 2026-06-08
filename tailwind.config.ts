import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        pondok: "rgb(var(--color-pondok) / <alpha-value>)",
        leaf: "rgb(var(--color-leaf) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        bone: "rgb(var(--color-bone) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)"
      }
    }
  },
  plugins: []
};

export default config;
