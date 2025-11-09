module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // Use only 'babel-preset-expo'
    plugins: [
      'react-native-reanimated/plugin', // Required for react-native-reanimated
    ],
  };
};