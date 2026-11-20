/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#102B2A',
          deep: '#102B2A',
          dark: '#0B1F1E',
          surface: '#163836',
          border: '#1E4442',
        },
        clinical: {
          DEFAULT: '#176B60',
          50: '#F4F8F6',
          100: '#EAF2EE', // Soft sage
          200: '#C7DFD9',
          300: '#9FC4BC',
          400: '#529F94',
          500: '#176B60', // Primary clinical green
          600: '#13564D',
          700: '#0F433C',
          800: '#0B302B',
          900: '#102B2A',
        },
        sage: {
          DEFAULT: '#EAF2EE',
          light: '#F4F8F6',
          border: '#C7DFD9',
          dark: '#D5E5DE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#F5F7F5',
          card: '#FFFFFF',
          border: '#E2E8E5',
          subtle: '#FAFCFA',
        },
        content: {
          primary: '#253746',
          secondary: '#718096',
          muted: '#94A3B8',
        },
        // Aliased palette to unify existing components
        brand: {
          50: '#F4F8F6',
          100: '#EAF2EE',
          200: '#C7DFD9',
          300: '#9FC4BC',
          400: '#529F94',
          500: '#176B60',
          600: '#176B60',
          700: '#13564D',
          800: '#0F433C',
          900: '#102B2A',
        },
        navy: {
          50: '#F5F7F5',
          100: '#EAF2EE',
          800: '#163836',
          900: '#102B2A',
        },
        teal: {
          50: '#F4F8F6',
          100: '#EAF2EE',
          200: '#C7DFD9',
          300: '#9FC4BC',
          400: '#529F94',
          500: '#176B60',
          600: '#176B60',
          700: '#13564D',
          800: '#0F433C',
          900: '#102B2A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 43, 42, 0.04)',
        'card': '0 2px 6px -1px rgba(16, 43, 42, 0.05), 0 1px 3px -1px rgba(16, 43, 42, 0.03)',
        'elevated': '0 10px 20px -3px rgba(16, 43, 42, 0.06), 0 4px 6px -2px rgba(16, 43, 42, 0.03)',
      },
      borderRadius: {
        'card': '14px',
      },
    },
  },
  plugins: [],
};
