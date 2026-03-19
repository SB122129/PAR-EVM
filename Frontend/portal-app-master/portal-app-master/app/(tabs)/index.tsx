import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ArrowRight, Nfc, QrCode } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';
import { PendingRequestsList } from '@/components/PendingRequestsList';
import { RecentActivitiesList } from '@/components/RecentActivitiesList';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UpcomingPaymentsList } from '@/components/UpcomingPaymentsList';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { Colors } from '@/constants/Colors';
import { useNostrService } from '@/context/NostrServiceContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useWalletManager } from '@/context/WalletManagerContext';
import { useThemeColor } from '@/hooks/useThemeColor';

const FIRST_LAUNCH_KEY = 'portal_first_launch_completed';

export default function Home() {
  const { isLoading, isOnboardingComplete } = useOnboarding();
  const { username, displayName } = useUserProfile();
  const nostrService = useNostrService();
  const walletService = useWalletManager();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For triggering immediate ConnectionStatusIndicator updates

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const secondaryTextColor = useThemeColor({}, 'textSecondary');
  const surfaceSecondaryColor = useThemeColor({}, 'surfaceSecondary');
  const borderPrimaryColor = useThemeColor({}, 'borderPrimary');
  const buttonPrimaryColor = useThemeColor({}, 'buttonPrimary');
  const buttonPrimaryTextColor = useThemeColor({}, 'buttonPrimaryText');
  const buttonSuccessTextColor = useThemeColor({}, 'buttonSuccessText');

  // This would come from a real user context in the future
  const [userPublicKey, setUserPublicKey] = useState('unknown pubkey');

  useEffect(() => {
    setUserPublicKey(nostrService.publicKey || '');
  }, [nostrService]);

  // Profile initialization is now handled automatically in UserProfileContext

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh wallet info
      await walletService.refreshWalletInfo();

      // Trigger ConnectionStatusIndicator update
      setRefreshTrigger(prev => prev + 1);
    } catch (_error) {}
    setRefreshing(false);
  };

  // Memoize the truncated key to prevent recalculation on every render
  const truncatedPublicKey = useMemo(() => {
    if (!userPublicKey) return '';

    // Get screen width to determine how many characters to show
    const screenWidth = Dimensions.get('window').width;

    // Adjust number of characters based on screen width
    let charsToShow = 22;
    if (screenWidth < 375) {
      charsToShow = 8;
    } else if (screenWidth < 414) {
      charsToShow = 14;
    }

    return `${userPublicKey.substring(0, charsToShow)}...${userPublicKey.substring(userPublicKey.length - charsToShow)}`;
  }, [userPublicKey]);

  // Memoize the username display logic - same responsive logic as npub
  // Truncate username only, then always append "@getportal.cc"
  const normalizedUsername = useMemo(() => {
    if (!username) return '';
    return /aegis/i.test(username) ? 'hbfounder' : username;
  }, [username]);

  const truncatedUsername = useMemo(() => {
    if (!normalizedUsername) return '';

    // Get screen width to determine how many characters to show (same logic as npub)
    const screenWidth = Dimensions.get('window').width;

    let charsToShow = 22;
    if (screenWidth < 375) {
      charsToShow = 8;
    } else if (screenWidth < 414) {
      charsToShow = 17;
    }

    // Use the same character limit as npub for the username part
    // This gives us responsive truncation that matches npub behavior
    if (normalizedUsername.length > charsToShow) {
      return `${normalizedUsername.substring(0, charsToShow - 3)}...`;
    }

    return normalizedUsername;
  }, [normalizedUsername]);

  // Memoize the display name for welcome text
  // Use display name if available, fallback to username
  const welcomeDisplayName = useMemo(() => {
    const sourceName = displayName || normalizedUsername;
    const nameToShow = sourceName && /aegis/i.test(sourceName) ? 'HB Vault Team' : sourceName;
    if (!nameToShow) return '';

    // Get screen width to determine how many characters to show
    const screenWidth = Dimensions.get('window').width;

    let charsToShow = 25; // Slightly more generous for display names
    if (screenWidth < 375) {
      charsToShow = 12;
    } else if (screenWidth < 414) {
      charsToShow = 20;
    }

    // Truncate if too long
    if (nameToShow.length > charsToShow) {
      return `${nameToShow.substring(0, charsToShow - 3)}...`;
    }

    return nameToShow;
  }, [displayName, normalizedUsername]);

  // Memoize handlers to prevent recreation on every render
  const handleScan = useCallback(async (scanType: 'nfc' | 'qr') => {
    // Determine the navigation path based on scan type
    const pathname = scanType === 'nfc' ? '/nfc' : '/qr';

    // Using 'modal' navigation to ensure cleaner navigation history
    router.push({
      pathname,
      params: {
        source: 'homepage',
        scanType, // Pass the scan type to the destination
        timestamp: Date.now(), // Prevent caching issues
      },
    });

    // Mark welcome banner as viewed when user interacts with scan buttons (same as old behavior)
    try {
      await SecureStore.setItemAsync(FIRST_LAUNCH_KEY, 'true');
    } catch (_e) {}
  }, []);

  // Legacy handler for backward compatibility
  const handleQrScan = useCallback(() => {
    handleScan('qr');
  }, [handleScan]);

  const handleSettingsNavigate = useCallback(() => {
    router.push('/(tabs)/IdentityList');
  }, []);

  // Don't render anything until onboarding state is loaded
  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={buttonPrimaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[buttonPrimaryColor]}
              tintColor={buttonPrimaryColor}
              title="Pull to refresh profile"
              titleColor={secondaryTextColor}
            />
          }
        >
          <ThemedView style={styles.header}>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: cardBackgroundColor,
                  borderColor: borderPrimaryColor,
                },
              ]}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.headerLeft} onPress={handleSettingsNavigate}>
                  <View style={styles.welcomeRow}>
                    <ThemedText
                      style={styles.welcomeText}
                      darkColor={Colors.dirtyWhite}
                      lightColor={Colors.gray700}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {username ? (
                        <>
                          Control Center,{' '}
                          <ThemedText style={styles.welcomeNameBold}>{welcomeDisplayName}</ThemedText>
                        </>
                      ) : (
                        'Control Center'
                      )}
                    </ThemedText>
                    <ConnectionStatusIndicator size={10} triggerRefresh={refreshTrigger} />
                  </View>
                  <View style={styles.userInfoContainer}>
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          backgroundColor: surfaceSecondaryColor,
                          borderColor: borderPrimaryColor,
                        },
                      ]}
                    >
                      <View
                        style={[styles.avatarPlaceholder, { backgroundColor: buttonPrimaryColor }]}
                      >
                        <ThemedText style={[styles.avatarPlaceholderText, { color: buttonPrimaryTextColor }]}> 
                          HB
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.userTextContainer}>
                      {username ? (
                        <ThemedText
                          style={styles.username}
                          numberOfLines={1}
                          ellipsizeMode="clip"
                          lightColor={Colors.gray900}
                          darkColor={Colors.almostWhite}
                        >
                          <ThemedText style={styles.usernameBold}>{truncatedUsername}</ThemedText>
                          <ThemedText style={styles.usernameBold}>@par</ThemedText>
                        </ThemedText>
                      ) : null}
                      <ThemedText
                        style={styles.publicKey}
                        lightColor={username ? Colors.gray600 : Colors.gray700}
                        darkColor={username ? Colors.dirtyWhite : Colors.almostWhite}
                      >
                        {truncatedPublicKey}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.headerButtonsContainer}>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.nfcButton, { backgroundColor: buttonPrimaryColor }]}
                      onPress={() => handleScan('nfc')}
                    >
                      <Nfc size={20} color={buttonPrimaryTextColor} />
                      <ThemedText style={[styles.nfcText, { color: buttonPrimaryTextColor }]}> 
                        Contactless
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.qrButton, { backgroundColor: buttonPrimaryColor }]}
                      onPress={() => handleScan('qr')}
                    >
                      <QrCode size={20} color={buttonPrimaryTextColor} />
                      <ThemedText style={[styles.qrText, { color: buttonPrimaryTextColor }]}> 
                        Scan QR
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ThemedView>

          <WelcomeBanner />

          {/* Pending Requests Section */}
          <PendingRequestsList />

          {/* Upcoming Payments Section */}
          <UpcomingPaymentsList />

          {/* Recent Activities Section */}
          <RecentActivitiesList />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerContent: {
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginTop: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 20,
    // backgroundColor handled by theme (buttonPrimary)
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
    flexShrink: 1,
  },
  publicKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  qrButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    // backgroundColor handled by theme (buttonPrimary)
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  buttonContainer: {
    flex: 1,
  },
  nfcButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    // backgroundColor handled by theme (buttonPrimary)
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  nfcText: {
    fontSize: 13,
    fontWeight: '600',
  },
  qrText: {
    fontSize: 13,
    fontWeight: '600',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeNameBold: {
    fontWeight: '700',
  },
  usernameBold: {
    fontWeight: '700',
  },
});
