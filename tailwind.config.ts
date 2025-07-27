import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Legacy Shadcn colors (for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // New AI-themed color system
        "ai-primary": {
          50: "var(--ai-primary-50)",
          100: "var(--ai-primary-100)",
          200: "var(--ai-primary-200)",
          300: "var(--ai-primary-300)",
          400: "var(--ai-primary-400)",
          500: "var(--ai-primary-500)",
          600: "var(--ai-primary-600)",
          700: "var(--ai-primary-700)",
          800: "var(--ai-primary-800)",
          900: "var(--ai-primary-900)",
        },
        "ai-electric": {
          50: "var(--ai-electric-50)",
          100: "var(--ai-electric-100)",
          200: "var(--ai-electric-200)",
          300: "var(--ai-electric-300)",
          400: "var(--ai-electric-400)",
          500: "var(--ai-electric-500)",
          600: "var(--ai-electric-600)",
          700: "var(--ai-electric-700)",
          800: "var(--ai-electric-800)",
          900: "var(--ai-electric-900)",
        },
        "ai-neural": {
          50: "var(--ai-neural-50)",
          100: "var(--ai-neural-100)",
          200: "var(--ai-neural-200)",
          300: "var(--ai-neural-300)",
          400: "var(--ai-neural-400)",
          500: "var(--ai-neural-500)",
          600: "var(--ai-neural-600)",
          700: "var(--ai-neural-700)",
          800: "var(--ai-neural-800)",
          900: "var(--ai-neural-900)",
        },

        // Semantic colors
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",

        // Surface colors
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",

        // Text colors
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",

        // Border colors
        "border-light": "var(--border-light)",
      },

      fontFamily: {
        primary: "var(--font-primary)",
        mono: "var(--font-mono)",
        display: "var(--font-display)",
      },

      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
      },

      lineHeight: {
        tight: "var(--leading-tight)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
      },

      fontWeight: {
        light: "var(--font-light)",
        normal: "var(--font-normal)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
        bold: "var(--font-bold)",
      },

      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
      },

      maxWidth: {
        "container-sm": "var(--container-sm)",
        "container-md": "var(--container-md)",
        "container-lg": "var(--container-lg)",
        "container-xl": "var(--container-xl)",
        "container-2xl": "var(--container-2xl)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
        DEFAULT: "var(--radius)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glass: "var(--shadow-glass)",
        ai: "var(--shadow-ai)",
      },

      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },

      transitionTimingFunction: {
        "ease-linear": "var(--ease-linear)",
        "ease-in": "var(--ease-in)",
        "ease-out": "var(--ease-out)",
        "ease-in-out": "var(--ease-in-out)",
        "ease-bounce": "var(--ease-bounce)",
      },

      backgroundImage: {
        "gradient-ai": "var(--ai-gradient-primary)",
        "gradient-neural": "var(--ai-gradient-neural)",
        "gradient-glass": "var(--ai-gradient-glass)",
        "gradient-hero": "var(--ai-gradient-hero)",
      },

      animation: {
        "pulse-ai": "pulse-ai 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        neural: "neural-pulse 3s ease-in-out infinite",
      },

      keyframes: {
        "pulse-ai": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.05)",
          },
        },
        shimmer: {
          "0%": {
            "background-position": "-200% 0",
          },
          "100%": {
            "background-position": "200% 0",
          },
        },
        "neural-pulse": {
          "0%, 100%": {
            "box-shadow": "0 0 0 0 rgba(99, 102, 241, 0.4)",
          },
          "50%": {
            "box-shadow": "0 0 0 20px rgba(99, 102, 241, 0)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
