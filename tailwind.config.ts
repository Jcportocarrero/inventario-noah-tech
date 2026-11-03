import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3fb",
          100: "#dbe6f6",
          200: "#b9cdec",
          500: "#2f5aa8",
          600: "#244a8f",
          700: "#1f3864",
          800: "#182b4d",
          900: "#111f38",
        },
      },
    },
  },
  plugins: [],
};
export default config;
