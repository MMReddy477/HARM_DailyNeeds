module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#5B2D90",
          deep: "#35175F",
          orange: "#FF6B35",
          gold: "#FFD54F",
          ink: "#221B2D",
          muted: "#777180"
        }
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(53, 23, 95, .10)"
      }
    }
  },
  plugins: []
};
