import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        viaje: {
          navy: "#0F2438",
          navy2: "#173A5A",
          navy3: "#1F4C73",
          red: "#C43A2E",
          red2: "#DE5142",
          gold: "#D89A3D",
          green: "#2F7A52",
          amber: "#B8752B",
          paper: "#FAF9F6",
          paperAlt: "#F1ECE1",
          ink: "#26313D",
          soft: "#5B6875",
          line: "#DCD4C4",
          mist: "#F1ECE1"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
