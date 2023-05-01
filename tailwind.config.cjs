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
        themes: [{
            default:{
                primary: '#2A6EFF',
                'base-100':'#F8F8F8',
                'base-200':"#A8A8A8",
                "base-300":"#212121",
                secondary: '#F6F8FC',
            }
        }]
    },
    // @ts-expect-error
    plugins: [require("daisyui"), require("tailwindcss-animation-delay"),
    ],
};

module.exports = config;
