/** @type {import('tailwindcss').Config} */
// @ts-ignore
const extendedTheme = require('@/lib/extendedTheme.cjs')
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            ...extendedTheme
        },
    },
    plugins: [require("tailwindcss-animate")],
}