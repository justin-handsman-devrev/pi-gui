/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0d1117",
          elevated: "#161b22",
          border: "#21262d",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#484f58",
        },
        accent: {
          blue: "#58a6ff",
          green: "#3fb950",
          red: "#f85149",
          yellow: "#d29922",
        },
      },
      fontFamily: {
        mono: [
          "Menlo",
          "Monaco",
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
