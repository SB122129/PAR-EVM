import { router } from 'expo-router';
import { Key, Lock, Shield } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { onboardingStyles as styles } from '@/components/onboarding/styles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useOnboardingFlow } from '@/context/OnboardingFlowContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Choice() {
  const { generateNewSeedPhrase, clearSeedPhrase } = useOnboardingFlow();

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const borderPrimary = useThemeColor({}, 'borderPrimary');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  const handleGenerate = () => {
    generateNewSeedPhrase();
    router.push('/(onboarding)/generate');
  };

  const handleImportSeed = () => {
    clearSeedPhrase();
    router.push('/(onboarding)/import');
  };

  const handleImportNsec = () => {
    clearSeedPhrase();
    router.push('/(onboarding)/import/nsec');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <OnboardingHeader onBack={() => router.back()} />

        <View style={styles.stepWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.pageContainer, styles.scrollPageContainer]}>
              <View
                style={[
                  choiceStyles.heroCard,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderPrimary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    choiceStyles.eyebrow,
                    {
                      color: buttonPrimary,
                      backgroundColor: surfaceSecondary,
                    },
                  ]}
                >
                  Identity Onboarding
                </ThemedText>
                <ThemedText type="title" style={choiceStyles.heroTitle}>
                  Setup Your Identity
                </ThemedText>
                <ThemedText style={[choiceStyles.heroSubtitle, { color: textSecondary }]}>
                  Choose how you want to create your digital identity and continue to secure setup.
                </ThemedText>
              </View>

              <View style={choiceStyles.optionGroup}>
                <TouchableOpacity
                  style={[
                    choiceStyles.optionCard,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: borderPrimary,
                    },
                  ]}
                  onPress={handleGenerate}
                  activeOpacity={0.85}
                >
                  <View style={choiceStyles.optionHeader}>
                    <View style={[choiceStyles.iconWrap, { backgroundColor: surfaceSecondary }]}>
                      <Key size={22} color={buttonPrimary} />
                    </View>
                    <View style={choiceStyles.tagWrap}>
                      <ThemedText style={[choiceStyles.optionTag, { color: buttonPrimary }]}>01</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="defaultSemiBold" style={choiceStyles.optionTitle}>
                    Generate New Seed Phrase
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionDescription, { color: textSecondary }]}>
                    Create a new 12-word seed phrase for a fresh start.
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionCta, { color: textPrimary }]}>Tap to continue</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    choiceStyles.optionCard,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: borderPrimary,
                    },
                  ]}
                  onPress={handleImportSeed}
                  activeOpacity={0.85}
                >
                  <View style={choiceStyles.optionHeader}>
                    <View style={[choiceStyles.iconWrap, { backgroundColor: surfaceSecondary }]}>
                      <Shield size={22} color={buttonPrimary} />
                    </View>
                    <View style={choiceStyles.tagWrap}>
                      <ThemedText style={[choiceStyles.optionTag, { color: buttonPrimary }]}>02</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="defaultSemiBold" style={choiceStyles.optionTitle}>
                    Import Existing Seed Phrase
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionDescription, { color: textSecondary }]}>
                    Restore your identity using an existing 12-word seed phrase.
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionCta, { color: textPrimary }]}>Tap to continue</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    choiceStyles.optionCard,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: borderPrimary,
                    },
                  ]}
                  onPress={handleImportNsec}
                  activeOpacity={0.85}
                >
                  <View style={choiceStyles.optionHeader}>
                    <View style={[choiceStyles.iconWrap, { backgroundColor: surfaceSecondary }]}>
                      <Lock size={22} color={buttonPrimary} />
                    </View>
                    <View style={choiceStyles.tagWrap}>
                      <ThemedText style={[choiceStyles.optionTag, { color: buttonPrimary }]}>03</ThemedText>
                    </View>
                  </View>
                  <ThemedText type="defaultSemiBold" style={choiceStyles.optionTitle}>
                    Import Nsec
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionDescription, { color: textSecondary }]}>
                    Restore your identity using an existing Nsec private key.
                  </ThemedText>
                  <ThemedText style={[choiceStyles.optionCta, { color: textPrimary }]}>Tap to continue</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const choiceStyles = StyleSheet.create({
  heroCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroTitle: {
    textAlign: 'left',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionGroup: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  optionTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  optionTitle: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'left',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  optionCta: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
});
