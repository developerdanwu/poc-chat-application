// @ts-ignore
/** @type {import('tailwindcss').Config} */
const config = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                'warm-gray': {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                }
            },
            keyframes: {
                'loading-fade': {
                    '0%': {
                        opacity: '0',
                    },
                    '50%': {
                        opacity: '80%'
                    },
                    '100%': {
                        opacity: '0'
                    }
                }
            }
        },
        animation: {
            'typing-dot': 'loading-fade 1.4s ease-in-out infinite'
        }
    },
    daisyui: {
        themes: [{
            default: {
                primary: '#2A6EFF',
                'base-100': '#F8F8F8',
                'base-200': "#A8A8A8",
                "base-300": "#212121",
                secondary: '#F6F8FC',
                neutral: '#DBDADA',
                'neutral-focus': '#BFBFBF',
                'neutral-content': '#F2F1F1',
            }
        }]
    },
    // @ts-expect-error
    plugins: [require("daisyui"), require("tailwindcss-animation-delay"),
    ],
};

module.exports = config;
