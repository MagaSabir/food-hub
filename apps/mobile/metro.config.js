// Metro для монорепо (pnpm workspaces).
// Чтобы бандлер видел код всего репо (в т.ч. @foodhubme/shared) и общие node_modules.
// См. https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Следим за изменениями во всём монорепо (пакеты вне apps/mobile).
config.watchFolders = [monorepoRoot];

// 2. Резолвим модули и из локального node_modules, и из корневого (pnpm-хойстинг).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. NativeWind: подключаем Tailwind через global.css.
module.exports = withNativeWind(config, { input: './global.css' });
