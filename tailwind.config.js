module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@ionic/react/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        education: "url('/assets/education-bg.png')",
      },
    },
  },
  plugins: [],
};
