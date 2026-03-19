/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * All colors should be theme-aware and centralized here.
 */

const tintColorLight = '#0E7C66';
const tintColorDark = '#98F5D8';

export const Colors = {
  light: {
    // Basic theme colors
    text: '#102A26',
    background: '#F5F1E8',
    cardBackground: '#FFFDF8',
    tint: tintColorLight,
    icon: '#5D7A72',
    tabIconDefault: '#5D7A72',
    tabIconSelected: tintColorLight,

    // Surface colors
    surfacePrimary: '#FFFDF8',
    surfaceSecondary: '#EFE7D9',
    surfaceTertiary: '#E3D6C2',

    // Text colors
    textPrimary: '#102A26',
    textSecondary: '#5D7A72',
    textTertiary: '#8B9C96',
    textInverse: '#ffffff',

    // Border colors
    borderPrimary: '#D9CDBA',
    borderSecondary: '#E8DDCB',
    borderFocus: '#0E7C66',

    // Shadow and overlay colors
    shadowColor: '#27453F',
    overlayBackground: 'rgba(24, 42, 39, 0.34)',
    modalBackground: 'rgba(24, 42, 39, 0.52)',

    // Input colors
    inputBackground: '#FFF9EF',
    inputBorder: '#D9CDBA',
    inputPlaceholder: '#9D9487',

    // Status colors
    statusConnected: '#1C9A66',
    statusConnecting: '#DB9B35',
    statusDisconnected: '#CF4A58',
    statusError: '#CF4A58',
    statusWarning: '#DB9B35',

    // Button colors
    buttonPrimary: '#0E7C66',
    buttonPrimaryText: '#ffffff',
    buttonSecondary: '#E7D9C5',
    buttonSecondaryText: '#2C4A43',
    buttonDanger: '#CF4A58',
    buttonDangerText: '#ffffff',
    buttonSuccess: '#1C9A66',
    buttonSuccessText: '#ffffff',

    // Skeleton/loading colors
    skeletonBase: '#E8DDCB',
    skeletonHighlight: '#FFF8EE',
  },
  dark: {
    // Basic theme colors
    text: '#F4F8F6',
    background: '#0F1716',
    cardBackground: '#182624',
    tint: tintColorDark,
    icon: '#9EC0B7',
    tabIconDefault: '#8DA79F',
    tabIconSelected: tintColorDark,

    // Surface colors
    surfacePrimary: '#182624',
    surfaceSecondary: '#223432',
    surfaceTertiary: '#2A4541',

    // Text colors
    textPrimary: '#F4F8F6',
    textSecondary: '#9EC0B7',
    textTertiary: '#6F8A82',
    textInverse: '#000000',

    // Border colors
    borderPrimary: '#2F4D48',
    borderSecondary: '#24403B',
    borderFocus: '#98F5D8',

    // Shadow and overlay colors
    shadowColor: '#000000',
    overlayBackground: 'rgba(0, 0, 0, 0.65)',
    modalBackground: 'rgba(0, 0, 0, 0.8)',

    // Input colors
    inputBackground: '#223432',
    inputBorder: '#335650',
    inputPlaceholder: '#7FA49A',

    // Status colors
    statusConnected: '#35D08F',
    statusConnecting: '#F4B443',
    statusDisconnected: '#F8717F',
    statusError: '#F8717F',
    statusWarning: '#F4B443',

    // Button colors
    buttonPrimary: '#2AA383',
    buttonPrimaryText: '#0D1715',
    buttonSecondary: '#2A4541',
    buttonSecondaryText: '#D9ECE7',
    buttonDanger: '#F8717F',
    buttonDangerText: '#ffffff',
    buttonSuccess: '#35D08F',
    buttonSuccessText: '#0D1715',

    // Skeleton/loading colors
    skeletonBase: '#2A4541',
    skeletonHighlight: 'rgba(152, 245, 216, 0.14)',
  },

  // Legacy colors - keeping for backward compatibility but should be migrated
  almostWhite: '#e6e6e6',
  dirtyWhite: '#bfbfbf',
  gray: '#b3b3b3',
  unselectedGray: '#687076',
  darkGray: '#222222',
  darkerGray: '#0c0c0c',
  green: '#004f4e',
  red: '#710729',

  // Major palette colors
  primary: '#0a7ea4',
  primaryLight: '#4fb3d9',
  primaryDark: '#005a75',
  secondary: '#f39c12',
  secondaryLight: '#f7dc6f',
  secondaryDark: '#d68910',

  // Semantic colors
  success: '#27ae60',
  successLight: '#58d68d',
  successDark: '#1e8449',
  warning: '#f39c12',
  warningLight: '#f7dc6f',
  warningDark: '#d68910',
  error: '#e74c3c',
  errorLight: '#ec7063',
  errorDark: '#c0392b',
  info: '#3498db',
  infoLight: '#85c1e9',
  infoDark: '#2874a6',

  // Neutral palette
  white: '#ffffff',
  secondaryWhite: '#ffffff',
  primaryWhite: '#F1F1F1',
  black: '#000000',
  gray100: '#f8f9fa',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#6c757d',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529',

  // Accent colors
  purple: '#9b59b6',
  purpleLight: '#bb8fce',
  purpleDark: '#7d3c98',
  orange: '#e67e22',
  orangeLight: '#f0b27a',
  orangeDark: '#ca6f1e',
  teal: '#1abc9c',
  tealLight: '#76d7c4',
  tealDark: '#148f77',
};
