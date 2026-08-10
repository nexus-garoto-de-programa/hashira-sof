import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coursue: {
          primary: "#5B50E5",
          primaryHover: "#483EA8",
          primaryLight: "#EBE8FF",
          dark: "#1E1B4B",
          muted: "#6B7280",
          bg: "#F4F5FB",
          surface: "#FFFFFF",
          border: "#EBF0F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        banner: "28px",
        card: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
