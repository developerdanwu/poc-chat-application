// @ts-nocheck
const {fontFamily} = require("tailwindcss/defaultTheme");
/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: ['class'],
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            fontSize: {
                h1: ['48px', {lineHeight: '48px', letterSpacing: '-1.2%', fontWeight: '800'}],
                h2: ['30px', {lineHeight: '36px', letterSpacing: '-0.75%', fontWeight: '600'}],
                h3: ['24px', {lineHeight: '32px', letterSpacing: '-0.6%', fontWeight: '600'}],
                h4: ['20px', {lineHeight: '28px', letterSpacing: '-0.5%', fontWeight: '600'}],
                p: ['16px', {lineHeight: '28px', letterSpacing: '0%', fontWeight: '400'}],
                body: ['14px', {lineHeight: '24px', letterSpacing: '0%', fontWeight: '400'}],
                lead: ['20px', {lineHeight: '28px', letterSpacing: '0%', fontWeight: '400'}],
                large: ['18px', {lineHeight: '28px', letterSpacing: '0%', fontWeight: '600'}],
                small: ['14px', {lineHeight: '14px', letterSpacing: '0%', fontWeight: '500'}],
                subtle: ['14px', {lineHeight: '20px', letterSpacing: '0%', fontWeight: '400'}],
                detail: ['12px', {lineHeight: '20px', letterSpacing: '0%', fontWeight: '400'}],
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: `var(--radius)`,
                md: `calc(var(--radius) - 2px)`,
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', ...fontFamily.sans],
            },
            keyframes: {
                'accordion-down': {
                    from: {height: 0},
                    to: {height: 'var(--radix-accordion-content-height)'},
                },
                'accordion-up': {
                    from: {height: 'var(--radix-accordion-content-height)'},
                    to: {height: 0},
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

module.exports = config;
