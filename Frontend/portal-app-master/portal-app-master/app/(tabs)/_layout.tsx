import { Tabs } from 'expo-router';
import {
  Bug,
  Coins,
  Home,
  List,
  Receipt,
  Settings,
  Ticket,
  UserSquare2,
  Wallet,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

// Memoized tab icons to prevent unnecessary re-rendering
const HomeIcon = React.memo(({ color }: { color: string }) => <Home size={24} color={color} />);

const SubscriptionIcon = React.memo(({ color }: { color: string }) => (
  <Receipt size={24} color={color} />
));

const TicketIcon = React.memo(({ color }: { color: string }) => <Ticket size={24} color={color} />);

const IdentityIcon = React.memo(({ color }: { color: string }) => (
  <UserSquare2 size={24} color={color} />
));

const SettingsIcon = React.memo(({ color }: { color: string }) => (
  <Settings size={24} color={color} />
));

const DebugIcon = React.memo(({ color }: { color: string }) => <Bug size={24} color={color} />);

const WalletIcon = React.memo(({ color }: { color: string }) => <Wallet size={24} color={color} />);
const VaultIcon = React.memo(({ color }: { color: string }) => <Coins size={24} color={color} />);

const ListIcon = React.memo(({ color }: { color: string }) => <List size={24} color={color} />);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarSurfaceColor = useThemeColor({}, 'cardBackground');
  const tabBarBorderColor = useThemeColor({}, 'borderPrimary');
  const tabBarActiveTintColor = useThemeColor(
    { light: Colors.primary, dark: Colors.almostWhite },
    'text'
  );
  const tabBarInactiveTintColor = useThemeColor(
    { light: Colors.gray600, dark: Colors.unselectedGray },
    'text'
  );

  // Memoize tab options to prevent recreation on every render
  const screenOptions = useMemo(
    () => ({
      tabBarPosition: 'top' as const,
      tabBarActiveTintColor,
      tabBarInactiveTintColor,
      headerShown: false,
      tabBarStyle: {
        marginTop: insets.top,
        paddingTop: 8,
        alignItems: 'center' as const,
        backgroundColor: tabBarSurfaceColor,
        height: Platform.OS === 'ios' ? 88 : 82,
        borderBottomWidth: 1,
        borderBottomColor: tabBarBorderColor,
        paddingBottom: 8,
        paddingHorizontal: 12,
        shadowColor: 'transparent',
        elevation: 0,
      },
      tabBarItemStyle: {
        borderRadius: 12,
        marginHorizontal: 2,
        paddingVertical: 1,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 0.2,
      },
      tabBarIconStyle: {
        marginTop: 0,
      },
      tabBarHideOnKeyboard: true,
      tabBarButton: (props: any) => <HapticTab {...props} />,
      // Preload adjacent tabs for smoother navigation
      lazy: false,
      // Optimize tab transition animation
      animationEnabled: true,
      // Preventing excessive re-renders
      freezeOnBlur: false,
      // Use hardware acceleration where possible
      detachInactiveScreens: false,
    }),
    [
      insets.top,
      tabBarSurfaceColor,
      tabBarBorderColor,
      tabBarActiveTintColor,
      tabBarInactiveTintColor,
    ]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }: { color: string }) => <ListIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Subscriptions"
        options={{
          title: 'Subscriptions',
          tabBarIcon: ({ color }: { color: string }) => <SubscriptionIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }: { color: string }) => <TicketIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }: { color: string }) => <WalletIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }: { color: string }) => <VaultIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }: { color: string }) => <SettingsIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="Debug"
        options={{
          title: 'Debug',
          tabBarIcon: ({ color }: { color: string }) => <DebugIcon color={color} />,
          href: null, // Hidden from tabs, accessible via Settings in dev mode
        }}
      />
      <Tabs.Screen
        name="Certificates"
        options={{
          title: 'Certificates',
          tabBarIcon: ({ color }: { color: string }) => <IdentityIcon color={color} />,
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="IdentityList"
        options={{
          title: 'Identities',
          tabBarIcon: ({ color }: { color: string }) => <IdentityIcon color={color} />,
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}
