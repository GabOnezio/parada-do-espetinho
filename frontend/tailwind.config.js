/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f97316', // laranja churrasqueira
        secondary: '#22c55e', // verde fresco
        charcoal: '#0f172a',
        sand: '#f1f5f9',
        smoke: '#1e293b'
      },
      boxShadow: {
        glass: '0 10px 30px rgba(15, 23, 42, 0.08)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
