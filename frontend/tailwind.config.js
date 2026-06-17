export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f5f4f0', 100: '#e8e5de', 200: '#d4cfc5',
          300: '#b8b0a0', 400: '#9a9082', 500: '#7d7266',
          600: '#635a4f', 700: '#4e463d', 800: '#3a342d',
          900: '#1e1a15', 950: '#0f0d0a',
        }
      },
    },
  },
  plugins: [],
}
