import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({}, 'tint');

  return (
    <Text
      style={[
        { color: type === 'link' ? linkColor : color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 31,
    lineHeight: 36,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  link: {
    lineHeight: 24,
    fontSize: 15,
    fontWeight: '700',
    // color handled by theme
  },
});
