// @ts-ignore
/** @type {import('tailwindcss').Config} */
const config = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
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
        themes: ['dark']
    },
    // @ts-expect-error
    plugins: [require("daisyui"), require("tailwindcss-animation-delay"),
    ],
};

module.exports = config;
