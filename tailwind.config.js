/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",   // Scan all files in the app directory
    "./pages/**/*.{js,ts,jsx,tsx}", // If you add pages later
    "./components/**/*.{js,ts,jsx,tsx}", // For reusable components
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb", // Primary brand color (blue)
          dark: "#1e40af",    // Darker shade
          light: "#60a5fa",   // Lighter shade
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"], // Clean modern font
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle card shadow
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),   // Better form styling
    require("@tailwindcss/typography"), // For rich text content
    require("@tailwindcss/aspect-ratio"), // For responsive images/videos
  ],
};
