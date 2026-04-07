/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./assets/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'mnoha-dark': '#020617',
        'mnoha-blue': '#3b82f6',
        'mnoha-slate': '#1e293b',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
