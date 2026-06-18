/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rally: {
          DEFAULT: '#FF4444',
          dark: '#E03333',
          light: '#FF6B6B',
        },
        ink: {
          900: '#0B0B0F',
          800: '#15151C',
          700: '#1E1E27',
          600: '#2A2A36',
          500: '#3A3A48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        sheet: '0 -8px 40px rgba(0,0,0,0.5)',
      },
      keyframes: {
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        sheetUp: 'sheetUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
