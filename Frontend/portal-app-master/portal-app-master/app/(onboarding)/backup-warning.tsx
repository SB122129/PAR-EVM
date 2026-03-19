import { router } from 'expo-router';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { onboardingStyles as styles } from '@/components/onboarding/styles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function BackupWarning() {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const buttonPrimary = useThemeColor({}, 'buttonPrimary');
  const buttonPrimaryText = useThemeColor({}, 'buttonPrimaryText');
  const textPrimary = useThemeColor({}, 'textPrimary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderPrimary = useThemeColor({}, 'borderPrimary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isSmallDevice = shortestSide <= 375;

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
                  warningStyles.alertHero,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderPrimary,
                  },
                ]}
              >
                <View style={warningStyles.alertHeaderRow}>
                  <View style={[warningStyles.alertIconWrap, { backgroundColor: surfaceSecondary }]}> 
                    <AlertTriangle size={isSmallDevice ? 30 : 34} color="#e79d1c" />
                  </View>
                  <View style={warningStyles.alertLabelWrap}>
                    <ThemedText style={[warningStyles.alertLabel, { color: '#e79d1c' }]}> 
                      Critical
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="title" style={[warningStyles.alertTitle, { color: textPrimary }]}> 
                  Important Security Notice
                </ThemedText>
                <ThemedText style={[warningStyles.alertSubtitle, { color: textSecondary }]}> 
                  Your recovery phrase controls your PAR identity. Protect it before proceeding.
                </ThemedText>
              </View>

              <View
                style={[
                  warningStyles.warningCard,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderPrimary,
                  },
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[warningStyles.warningCardTitle, isSmallDevice && warningStyles.warningCardTitleSmall]}
                >
                  Your seed phrase is your master key
                </ThemedText>
                <ThemedText
                  style={[
                    warningStyles.warningText,
                    isSmallDevice && warningStyles.warningTextSmall,
                    { color: textSecondary },
                  ]}
                >
                  PAR generates a unique 12-word seed phrase that gives you complete control over
                  your digital identity and authentication.
                </ThemedText>
              </View>

              <View style={warningStyles.warningPointsContainer}>
                <View
                  style={[
                    warningStyles.warningPoint,
                    { backgroundColor: cardBackgroundColor, borderColor: borderPrimary },
                  ]}
                >
                  <View style={[warningStyles.pointIconWrap, { backgroundColor: `${buttonPrimary}1F` }]}> 
                    <CheckCircle size={18} color={buttonPrimary} />
                  </View>
                  <ThemedText style={[warningStyles.warningPointText, { color: textPrimary }]}> 
                    <ThemedText type="defaultSemiBold">Write it down</ThemedText> on paper and store
                    it safely
                  </ThemedText>
                </View>

                <View
                  style={[
                    warningStyles.warningPoint,
                    { backgroundColor: cardBackgroundColor, borderColor: borderPrimary },
                  ]}
                >
                  <View style={[warningStyles.pointIconWrap, { backgroundColor: `${buttonPrimary}1F` }]}> 
                    <CheckCircle size={18} color={buttonPrimary} />
                  </View>
                  <ThemedText style={[warningStyles.warningPointText, { color: textPrimary }]}> 
                    <ThemedText type="defaultSemiBold">Never share it</ThemedText> with anyone - not
                    even PAR Support
                  </ThemedText>
                </View>

                <View
                  style={[
                    warningStyles.warningPoint,
                    { backgroundColor: cardBackgroundColor, borderColor: borderPrimary },
                  ]}
                >
                  <View style={[warningStyles.pointIconWrap, { backgroundColor: `${buttonPrimary}1F` }]}> 
                    <CheckCircle size={18} color={buttonPrimary} />
                  </View>
                  <ThemedText style={[warningStyles.warningPointText, { color: textPrimary }]}> 
                    <ThemedText type="defaultSemiBold">Keep multiple copies</ThemedText> in secure,
                    separate locations
                  </ThemedText>
                </View>

                <View
                  style={[
                    warningStyles.warningPoint,
                    warningStyles.warningPointDanger,
                    { backgroundColor: cardBackgroundColor, borderColor: '#e27b7b66' },
                  ]}
                >
                  <View style={[warningStyles.pointIconWrap, { backgroundColor: '#e27b7b1F' }]}> 
                    <AlertTriangle size={18} color="#d9534f" />
                  </View>
                  <ThemedText style={[warningStyles.warningPointText, { color: textPrimary }]}> 
                    <ThemedText type="defaultSemiBold">If you lose it, you lose access</ThemedText>{' '}
                    - we cannot recover it
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, styles.footerStack, warningStyles.footer]}> 
            <TouchableOpacity
              style={[styles.button, warningStyles.ctaButton, { backgroundColor: buttonPrimary }]}
              onPress={() => router.push('/(onboarding)/choice')}
            >
              <ThemedText style={[styles.buttonText, warningStyles.ctaButtonText, { color: buttonPrimaryText }]}> 
                I Understand
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const warningStyles = StyleSheet.create({
  alertHero: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  alertIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertLabelWrap: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e79d1c66',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  alertLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  alertTitle: {
    textAlign: 'left',
    marginBottom: 6,
  },
  alertSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  warningCardTitle: {
    fontSize: 24,
    textAlign: 'left',
    marginBottom: 8,
  },
  warningCardTitleSmall: {
    fontSize: 20,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 21,
  },
  warningTextSmall: {
    fontSize: 13,
    lineHeight: 20,
  },
  warningPointsContainer: {
    width: '100%',
    marginBottom: 22,
    gap: 10,
  },
  warningPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  warningPointDanger: {
    borderStyle: 'solid',
  },
  pointIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningPointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingBottom: 24,
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 18,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
