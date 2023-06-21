/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('flowbite/plugin')
]
};
