// Babel config required by Expo SDK 56 + react-native-reanimated 4.x.
//
// Without `react-native-worklets/plugin` the worklets layer doesn't get
// transformed, which leaves Reanimated half-initialised at runtime.
// Once Reanimated is half-init it patches RN's Animated subsystem in a
// way that silently drops `useNativeDriver: true` animations — that's
// why ALL animations in the app (slide-ins, pulsing flame, hydration
// pops, task check bounce, modals) appeared to "not run" in v15.
//
// IMPORTANT: the worklets plugin must be LAST in the plugins array.
// Reanimated 4 replaced the old `react-native-reanimated/plugin` with
// `react-native-worklets/plugin` (the reanimated plugin entry now just
// re-exports it).

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
