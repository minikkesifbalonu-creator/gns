/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                'background-light': '#F8FAFC',
                'card-dark': '#1e293b',
                'background-dark': '#0f172a',
            }
        },
    },
    plugins: [],
}
