/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        accent: "#10b981",
        neutral: {
          50: "#f9fafb",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
}
