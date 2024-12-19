/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mono-50': '#fbfbfb',
        'mono-100': '#f7f7f7',
        'mono-200': '#ebebeb',
        'mono-300': '#dcdcdc',
        'mono-400': '#b2b2b2',
        'mono-500': '#808080',
        'mono-600': '#636363',
        'mono-700': '#343a40',
        'mono-800': '#212529',
        'mono-900': '#2e2e2e',
      }
    },
  },
  plugins: [],
}

