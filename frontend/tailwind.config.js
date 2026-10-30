/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#E8E9E5',
          muted: '#DDDFDA',
          light: '#F4F5F2',
          border: '#1A231E',
        },
        forest: {
          DEFAULT: '#0D1F17',
          light: '#1B4530',
          dark: '#08140E',
          muted: '#2C3B32',
          50: '#F2F6F3',
          100: '#E1ECE5',
          200: '#C3D9CC',
          700: '#1B4530',
          800: '#102B1E',
          900: '#08140E',
        },
        grid: {
          DEFAULT: '#1A231E',
          line: '#1A231E',
        },
        coral: {
          DEFAULT: '#E15A3E',
          light: '#FECACA',
          dark: '#7F1D1D',
          border: '#7F1D1D',
        },
        mint: {
          DEFAULT: '#10B981',
          light: '#A7F3D0',
          dark: '#064E3B',
          border: '#064E3B',
        },
        gold: {
          DEFAULT: '#EAB308',
          light: '#FDE68A',
          dark: '#78350F',
          border: '#78350F',
        },
        // Legacy alias overrides to enforce Technical Minimalist palette
        navy: {
          50: '#F7F7F5',
          100: '#F0F0EB',
          200: '#E6E6E0',
          300: '#D5D5CD',
          400: '#737370',
          500: '#3A3A38',
          600: '#2E2E2C',
          700: '#1A3C2B',
          800: '#F2F2ED',
          900: '#EFEFEA',
          950: '#F7F7F5',
        },
        cyber: {
          green: '#1A3C2B',
          cyan: '#1A3C2B',
          blue: '#1A3C2B',
          purple: '#1A3C2B',
          danger: '#FF8C69',
          warning: '#F4D35E',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'General Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
