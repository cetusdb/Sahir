import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0b0d12',
        panel:   '#141821',
        card:    '#1b2030',
        border:  '#252b3b',
        text:    '#e9edf5',
        muted:   '#9aa3b2',
        accent:  '#ffb400',     // IMDb-vari altın
        accent2: '#22d3ee'
      }
    }
  },
  plugins: []
};

export default config;
