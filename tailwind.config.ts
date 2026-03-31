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
        "accent-warm": "var(--accent-warm)",
        "surface-glass": "var(--surface-glass)",
        sidebar: "var(--sidebar)",
        "drawer-surface": "var(--drawer-surface)",
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        "status-saved": "var(--status-saved)",
        "status-applied": "var(--status-applied)",
        "status-interview": "var(--status-interview)",
        "status-offer": "var(--status-offer)",
        "status-rejected": "var(--status-rejected)",
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
        "glow-md": "var(--glow-md)",
        "glow-lg": "var(--glow-lg)",
        "inner-glow": "inset 0 0 24px rgba(255, 255, 255, 0.06)",
        "card-3d": "none",
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
          "radial-gradient(at 12% 12%, rgba(255, 106, 43, 0.12) 0px, transparent 45%), radial-gradient(at 85% 18%, rgba(255, 138, 80, 0.1) 0px, transparent 45%), radial-gradient(at 45% 80%, rgba(255, 122, 61, 0.08) 0px, transparent 45%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
