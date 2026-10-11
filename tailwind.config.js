/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Mona Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Neutral graphite. Replaces Tailwind's blue-tinted slate across the whole app.
        slate: {
          50: '#f7f8f8',
          100: '#eeeff1',
          200: '#e1e3e6',
          300: '#c8cbd0',
          400: '#9a9ea6',
          500: '#6f737b',
          600: '#4e5158',
          700: '#35373c',
          800: '#24262a',
          900: '#17181b',
          950: '#0d0e10',
        },
        dark: {
          950: '#08090a',
          900: '#0f1012',
          850: '#141518',
          800: '#1c1d21',
          700: '#2a2c31',
          600: '#3d4046',
        },
        cyan: {
          450: '#00d2ff',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          purple: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'dash 1.5s linear infinite',
      },
      keyframes: {
        dash: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
