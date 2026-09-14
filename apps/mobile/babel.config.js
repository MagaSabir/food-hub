// Babel для Expo + NativeWind.
// jsxImportSource: 'nativewind' — чтобы className работал на RN-компонентах.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
