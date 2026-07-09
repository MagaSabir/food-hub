const apiUrl = import.meta.env.VITE_API_URL;

// Fail-fast: нет переменной — падаем сразу с понятной ошибкой.
if (!apiUrl) {
  throw new Error(
    'VITE_API_URL не задан. Проверь .env.development / .env.production.',
  );
}

/** Типобезопасный конфиг: `import { env } from './config/env'` → `env.apiUrl`. */
export const env = {
  apiUrl,
} as const;
