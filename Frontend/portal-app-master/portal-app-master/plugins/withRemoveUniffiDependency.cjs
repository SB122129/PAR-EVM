const fs = require('fs');
const path = require('path');

/**
 * Custom Expo plugin to patch breeztech-breez-sdk-spark-react-native podspec
 * to use uniffi-bindgen-react-native version 0.29.0-0 instead of 0.28.3-5.
 */
const withRemoveUniffiDependency = config => {
  // Patch the podspec file directly
  const projectRoot = process.cwd();
  const podspecPath = path.join(
    projectRoot,
    'node_modules',
    '@breeztech',
    'breez-sdk-spark-react-native',
    'breeztech-breez-sdk-spark-react-native.podspec'
  );

  try {
    if (fs.existsSync(podspecPath)) {
      let podspecContents = fs.readFileSync(podspecPath, 'utf8');

      // Check if already patched
      if (!podspecContents.includes('uniffi-bindgen-react-native", "0.29.0-0"')) {
        // Replace the dependency version from 0.28.3-5 to 0.29.0-0
        podspecContents = podspecContents.replace(
          /s\.dependency\s+"uniffi-bindgen-react-native",\s+"0\.28\.3-5"/,
          's.dependency    "uniffi-bindgen-react-native", "0.29.0-0"'
        );

        fs.writeFileSync(podspecPath, podspecContents, 'utf8');
        console.log('✅ Successfully patched breeztech-breez-sdk-spark-react-native.podspec');
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to patch podspec file:', error);
  }

  return config;
};

// Use module.exports for CommonJS compatibility with Expo
module.exports = withRemoveUniffiDependency;
