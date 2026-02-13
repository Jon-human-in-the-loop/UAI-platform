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
        background: "hsl(220 20% 6%)",
        foreground: "hsl(0 0% 100%)",
        primary: {
          DEFAULT: "#8B0000", // Maroon Depth
          light: "#B22222",
        },
        accent: {
          DEFAULT: "#D4AF37", // Metallic Gold
          glow: "rgba(212, 175, 55, 0.4)",
        },
        card: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
