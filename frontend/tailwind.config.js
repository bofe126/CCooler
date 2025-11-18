/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        danger: '#EF4444',
        background: '#F9FAFB',
        text: '#111827',
      },
    },
  },
  plugins: [],
}
