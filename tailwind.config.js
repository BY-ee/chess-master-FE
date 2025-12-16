/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'chess-dark': '#262421',
                'chess-board-dark': '#769656',
                'chess-board-light': '#eeeed2',
            }
        },
    },
    plugins: [],
}
