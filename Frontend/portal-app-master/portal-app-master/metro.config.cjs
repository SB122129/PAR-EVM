/*const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow modern JS exports
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push('mjs');

// Ignore native-only modules when building for web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName.includes('Libraries/NewAppScreen') ||
     moduleName.includes('Libraries/Utilities/Platform'))
  ) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
*/

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to the list of recognized extensions
config.resolver.assetExts.push('wasm');

// Allow modern JS exports and .mjs files
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push('mjs');

// Shim Node.js built-ins that WalletConnect and other web3 libs depend on
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    // Redirect Node's crypto to the React Native polyfill
    return context.resolveRequest(context, 'react-native-get-random-values', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
