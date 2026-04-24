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
                /* ── CareLoop Landing Page – Material Design 3 Teal Palette ── */
                cl: {
                    primary: '#006a6a',
                    'on-primary': '#ffffff',
                    'primary-container': '#1fb7b7',
                    'on-primary-container': '#004242',
                    secondary: '#576061',
                    'on-secondary': '#ffffff',
                    surface: '#f9f9f9',
                    'on-surface': '#1a1c1c',
                    'on-surface-variant': '#3c4949',
                    'surface-container': '#eeeeee',
                    'surface-container-low': '#f3f3f3',
                    'surface-container-high': '#e8e8e8',
                    'surface-container-highest': '#e2e2e2',
                    'surface-container-lowest': '#ffffff',
                    'primary-fixed': '#74f6f6',
                    'primary-fixed-dim': '#54d9d9',
                    outline: '#6c7a79',
                    'outline-variant': '#bbc9c8',
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
