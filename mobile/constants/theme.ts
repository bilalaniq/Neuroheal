/**
 * Neumorphism Design System with Soft, Muted Colors
 * Soft shadows, embossed effect, and calming palette
 */

import { Platform } from 'react-native';

// Soft, Muted Green Neumorphism Palette
const softGreen = '#d4e8e0';      // Base soft green
const mutedGreen = '#a8d5c4';     // Muted accent green
const darkGreen = '#5a8f7f';      // Dark accent
const creamWhite = '#f5f8f7';     // Soft white
const darkBackground = '#1a2622'; // Dark mode background

export const Colors = {
  light: {
    text: '#2d4a42',              // Soft dark text
    background: '#f5f8f7',        // Cream white background
    tint: '#a8d5c4',              // Muted green accent
    icon: '#7a9f94',              // Medium soft green
    tabIconDefault: '#8fa9a0',
    tabIconSelected: '#a8d5c4',   // Muted green selected
    primary: '#a8d5c4',           // Primary muted green
    secondary: '#c4dbd2',         // Light muted green
    accent: '#7a9f94',            // Soft dark green
    success: '#a8d5c4',           // Success soft green
    warning: '#d4b896',           // Soft warm brown
    error: '#c89898',             // Soft muted red
    card: '#f0f5f3',              // Light card background
    border: '#d4e8e0',            // Soft green border
    shadow: '#00000012',          // Light shadow for neumorphism
    insetShadow: '#00000008',     // Subtle inset shadow
  },
  dark: {
    text: '#e8f0ed',              // Soft light text
    background: '#1a2622',        // Very dark green bg
    tint: '#7a9f94',              // Soft green accent
    icon: '#a8d5c4',              // Light soft green
    tabIconDefault: '#7a9f94',
    tabIconSelected: '#a8d5c4',   // Light green selected
    primary: '#7a9f94',           // Primary soft green
    secondary: '#5a8f7f',         // Darker soft green
    accent: '#a8d5c4',            // Light accent
    success: '#8fbeaf',           // Soft green
    warning: '#dab88a',           // Soft warm tone
    error: '#d4a5a5',             // Soft red
    card: '#253029',              // Dark card background
    border: '#3f5451',            // Dark green border
    shadow: '#00000033',          // Darker shadow for neumorphism
    insetShadow: '#ffffff08',     // Subtle light inset shadow
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
