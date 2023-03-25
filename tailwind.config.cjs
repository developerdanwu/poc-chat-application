/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  daisyui:{
    themes:['dark']
  },
  plugins: [require("daisyui")],
};

module.exports = config;
