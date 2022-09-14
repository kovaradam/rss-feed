const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      lineClamp: {
        10: '10',
      },
      colors: {
        accent: '#ff5678',
        background: 'bg-yellow-50',
      },
    },
  },
  variants: {
    extend: {
      lineClamp: ['hover'],
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    plugin(({ addVariant }) => {
      addVariant('active-select-item', '&[data-active-item]');
    }),
  ],
};
