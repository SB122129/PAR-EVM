import { Text, View } from 'react-native';

export default function WebHome() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#f7f8fa',
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 10 }}>
        PAR Mobile App
      </Text>
      <Text style={{ fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 }}>
        This project targets native devices. For complete behavior, run the Android dev client or iOS build.
      </Text>
    </View>
  );
}