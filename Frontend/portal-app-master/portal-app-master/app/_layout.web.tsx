import { Stack } from 'expo-router';
import { Platform, Text, View } from 'react-native';

function WebNotSupportedBanner() {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff4cc',
        borderBottomWidth: 1,
        borderBottomColor: '#f0d98c',
      }}
    >
      <Text style={{ color: '#4d3c00', textAlign: 'center' }}>
        Web preview runs in a limited compatibility mode. Use Android or iOS for full functionality.
      </Text>
    </View>
  );
}

export default function RootLayoutWeb() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
      <WebNotSupportedBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f7f8fa' } }} />
    </View>
  );
}