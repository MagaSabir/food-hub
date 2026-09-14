# @foodhub/mobile

React Native + **Expo** (Expo Router) — клиентское приложение (Feature-Sliced Design).
Стили — NativeWind. Каркас — **шаг 0.7** (см. `foodhub-specs-v2/13-build-plan.md`).
Спека — `foodhub-specs-v2/04-mobile-app.md`.

## Запуск (dev)

```bash
pnpm --filter @foodhub/mobile dev      # expo start
# затем: сканировать QR в Expo Go (SDK 54) на телефоне, либо w — web, i/a — эмулятор
```

## SDK

Сейчас **SDK 54** — ради Expo Go на физическом устройстве (в сторах Expo Go пока 54).
Апгрейд до 57 — позже (первый dev build / перед деплоем). См. шаг 0.7.1 в билд-плане.

## Проверка

```bash
pnpm --filter @foodhub/mobile build    # tsc --noEmit (типы)
pnpm --filter @foodhub/mobile lint      # expo lint
```
