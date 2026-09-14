/** @type {import('tailwindcss').Config} */
module.exports = {
  // Файлы, где ищем className для генерации стилей.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './widgets/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './entities/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  // Пресет NativeWind — адаптирует Tailwind под React Native.
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Токены из ДИЗАЙН-СПЕКИ Sabir (Apple HIG / premium minimal, 8pt grid).
      // Эталон = спека (надёжнее пипетки по фото). primary green = #49B85D.
      colors: {
        primary: {
          50: '#EAF8ED', // Light
          100: '#D5F0DB',
          200: '#AEE2B9',
          300: '#86D396',
          400: '#63C574',
          500: '#49B85D', // Primary
          600: '#3FA853', // Hover
          700: '#37924A', // Pressed
          800: '#2C7A3D',
          900: '#22602F',
        },
        // Текст (Apple-палитра)
        ink: {
          DEFAULT: '#1D1D1F', // primary
          secondary: '#6E6E73',
          placeholder: '#A1A1A6',
          disabled: '#C7C7CC',
        },
        canvas: '#FAFAFB', // фон экрана (Surface); карточки — bg-white (#FFFFFF)
        'surface-2': '#F5F6F8', // поиск / неактивный чип (Secondary Surface)
        hairline: '#ECECEC', // границы
        rating: '#FFB800', // звезда
        success: '#49B85D',
        error: '#EB5757',
      },
      borderRadius: {
        search: '16px',
        chip: '22px',
        logo: '18px',
        card: '24px',
        nav: '32px',
      },
    },
  },
  plugins: [],
};
