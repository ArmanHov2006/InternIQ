import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        glow: "var(--glow)",
        "accent-cyan": "var(--accent-cyan)",
        "surface-glass": "var(--surface-glass)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-xs": "0 0 12px var(--glow)",
        "glow-sm": "0 0 20px var(--glow)",
        "glow-md": "0 0 40px var(--glow), 0 0 80px oklch(0.65 0.25 265 / 15%)",
        "glow-lg":
          "0 0 60px var(--glow), 0 0 120px oklch(0.65 0.25 265 / 10%), 0 0 200px oklch(0.7 0.2 300 / 5%)",
        "inner-glow": "inset 0 0 24px oklch(1 0 0 / 8%)",
        "card-3d": "0 20px 55px oklch(0.1 0.02 260 / 45%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 24px var(--glow)" },
          "50%": { boxShadow: "0 0 42px var(--glow)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          "0%": { opacity: "0", filter: "blur(10px)" },
          "100%": { opacity: "1", filter: "blur(0px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "slide-up": "slide-up .6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in .45s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blur-in": "blur-in .6s cubic-bezier(0.16, 1, 0.3, 1) both",
        gradient: "gradient 8s ease infinite",
        marquee: "marquee 24s linear infinite",
      },
      backgroundImage: {
        "mesh-gradient":
          "radial-gradient(at 12% 12%, oklch(0.65 0.25 265 / 0.35) 0px, transparent 45%), radial-gradient(at 85% 18%, oklch(0.7 0.2 300 / 0.35) 0px, transparent 45%), radial-gradient(at 45% 80%, oklch(0.75 0.15 195 / 0.25) 0px, transparent 45%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
