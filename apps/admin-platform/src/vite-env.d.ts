/// <reference types="vite/client" />

// Типизируем свои VITE_* переменные (иначе import.meta.env.VITE_API_URL был бы any).
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
