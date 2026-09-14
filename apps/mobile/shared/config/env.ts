const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL не задан. Проверь .env.development / .env.production в apps/mobile.',
  );
}

export const env = {
  apiUrl,
} as const;
