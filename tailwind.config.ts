import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fb',
                    400: '#36adf6',
                    500: '#0c93e7',
                    600: '#0074c5',
                    700: '#015da0',
                    800: '#064f84',
                    900: '#0b426e',
                },
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                /* ── CareLoop Landing Page Design System ── */
                cl: {
                    primary: '#1FB7B7',
                    'primary-dark': '#199A9A',
                    'primary-light': '#74F6F6',
                    secondary: '#262F30',
                    tertiary: '#F2F1EB',
                    neutral: '#CFCFCF',
                    'neutral-dark': '#9CA3AF',
                    white: '#FFFFFF',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
                manrope: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

export default config
