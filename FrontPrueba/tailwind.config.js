/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        sidebar: '#050505',
        header: '#111827',
        card: '#18181B',
        border: '#1F2937',
        accent: '#EF000F'
      }
    }
  },
  plugins: [],
};
