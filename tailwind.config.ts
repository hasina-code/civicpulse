import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        signal: {
          navy: "#111C33",
          cream: "#F7F5EE",
          card: "#FFFFFF",
          night: "#0B1120",
          gold: "#FACC15",
          blue: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
