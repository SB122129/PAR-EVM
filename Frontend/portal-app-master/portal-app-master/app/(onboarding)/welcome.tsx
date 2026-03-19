import { router } from 'expo-router';
import { Shield, Zap } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onboardingLogo } from '@/components/onboarding/assets';
import { onboardingStyles as styles } from '@/components/onboarding/styles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useOnboardingFlow } from '@/context/OnboardingFlowContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Welcome() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const buttonPrimaryText = useThemeColor({}, 'buttonPrimaryText');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const borderPrimary = useThemeColor({}, 'borderPrimary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const { setOnboardingPath } = useOnboardingFlow();

  const handleGetStarted = () => {
    setOnboardingPath('simple');
    router.push('/(onboarding)/simple-setup');
  };

  const handleAdvanced = () => {
    setOnboardingPath('advanced');
    router.push('/(onboarding)/backup-warning');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={onboardingLogo} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.stepWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.pageContainer, styles.scrollPageContainer]}>
              <View
                style={[
                  welcomeStyles.heroCard,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderPrimary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    welcomeStyles.eyebrow,
                    {
                      color: buttonPrimary,
                      backgroundColor: surfaceSecondary,
                    },
                  ]}
                >
                  PAR Onboarding
                </ThemedText>
                <ThemedText type="title" style={[welcomeStyles.heroTitle, { color: textPrimary }]}> 
                  Welcome to PAR
                </ThemedText>
                <ThemedText style={[welcomeStyles.heroSubtitle, { color: textSecondary }]}> 
                  Your sovereign identity wallet for secure authentication and payment approvals.
                </ThemedText>
              </View>

              <View style={welcomeStyles.featureGrid}>
                <View
                  style={[
                    welcomeStyles.featureCard,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: borderPrimary,
                    },
                  ]}
                >
                  <View style={[welcomeStyles.iconWrap, { backgroundColor: surfaceSecondary }]}> 
                    <Shield size={24} color={buttonPrimary} />
                  </View>
                  <ThemedText type="defaultSemiBold" style={welcomeStyles.featureTitle}>
                    Self-Sovereign Identity
                  </ThemedText>
                  <ThemedText style={[welcomeStyles.featureDescription, { color: textSecondary }]}> 
                    Own and control your digital identity without relying on centralized services
                  </ThemedText>
                </View>

                <View
                  style={[
                    welcomeStyles.featureCard,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: borderPrimary,
                    },
                  ]}
                >
                  <View style={[welcomeStyles.iconWrap, { backgroundColor: surfaceSecondary }]}> 
                    <Zap size={24} color={buttonPrimary} />
                  </View>
                  <ThemedText type="defaultSemiBold" style={welcomeStyles.featureTitle}>
                    Wallet Integration
                  </ThemedText>
                  <ThemedText style={[welcomeStyles.featureDescription, { color: textSecondary }]}> 
                    Connect and interact with Lightning wallets through Nostr Wallet Connect
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, styles.footerStack, welcomeStyles.footer]}> 
            <TouchableOpacity
              style={[styles.button, welcomeStyles.primaryButton, { backgroundColor: buttonPrimary }]}
              onPress={handleGetStarted}
            >
              <ThemedText style={[styles.buttonText, welcomeStyles.buttonText, { color: buttonPrimaryText }]}> 
                Get Started
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                welcomeStyles.secondaryButton,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: buttonPrimary,
                },
              ]}
              onPress={handleAdvanced}
            >
              <ThemedText style={[styles.buttonText, welcomeStyles.buttonText, { color: buttonPrimary }]}> 
                Advanced
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const welcomeStyles = StyleSheet.create({
  heroCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  eyebrow: {
    alignSelf: 'flex-start',
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
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureGrid: {
    width: '100%',
    gap: 12,
  },
  featureCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 22,
    textAlign: 'left',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 24,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 18,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
