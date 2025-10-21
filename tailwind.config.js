/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { blue: "#1e3a8a", green: "#059669", light: "#f8fafc" }
      },
      boxShadow: { soft: "0 10px 25px rgba(0,0,0,0.06)" },
      borderRadius: { xl2: "1rem" }
    },
  },
  plugins: [],
}
