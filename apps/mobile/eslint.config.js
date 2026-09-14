// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
// Prettier как ESLint-правило (как в backend): формат чинится на Ctrl+S / --fix.
// `recommended` включает eslint-config-prettier (гасит конфликтующие правила) + prettier/prettier.
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
  },
]);
