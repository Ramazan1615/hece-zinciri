/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '15%': { transform: 'translate3d(-6px, 3px, 0) rotate(-1deg)' },
          '30%': { transform: 'translate3d(6px, -4px, 0) rotate(1deg)' },
          '45%': { transform: 'translate3d(-5px, -2px, 0) rotate(-0.5deg)' },
          '60%': { transform: 'translate3d(5px, 3px, 0) rotate(0.5deg)' },
          '75%': { transform: 'translate3d(-3px, 1px, 0)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.75)' },
          '20%': { opacity: '1', transform: 'translateY(-6px) scale(1.1)' },
          '80%': { opacity: '1', transform: 'translateY(-28px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-44px) scale(0.9)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '70%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blastOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '40%': { opacity: '1', transform: 'scale(1.22)' },
          '100%': { opacity: '0', transform: 'scale(0.1)' },
        }
      },
      animation: {
        shake: 'shake 0.42s cubic-bezier(.36,.07,.19,.97) both',
        floatUp: 'floatUp 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        popIn: 'popIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        blastOut: 'blastOut 0.36s ease-out forwards',
      }
    },
  },
  plugins: [],
}
