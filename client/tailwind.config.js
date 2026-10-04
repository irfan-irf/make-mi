/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { navy: '#131921', 'navy-light': '#232f3e', amber: '#febd69', canvas: '#f3f4f6' }, boxShadow: { soft: '0 8px 24px rgba(15, 23, 42, .08)' } } },
  plugins: [],
};
