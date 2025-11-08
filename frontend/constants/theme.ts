import { Platform, useColorScheme } from 'react-native';

const tintColorLight = '#4CAF50';  // fresh green
const tintColorDark = '#93c47d';   // may change later

export const Colors = {
  light: {
    text: '#1C1C1C',              // charcoal text
    background: '#F9F7F1',        // eggshell / off-white
    surface: '#FFFFFF',           // card background
    tint: tintColorLight,         // primary green
    accent: '#A3C9A8',            // secondary accent
    border: '#E3E1DC',            // subtle dividers
    icon: '#5E8B7E',              // muted green-gray icons
    tabIconDefault: '#B6B6B6',
    tabIconSelected: tintColorLight,
    shadow: 'rgba(0, 0, 0, 0.05)', // soft shadow
    disabled: '#ccc', 
    disabledText: '#4e504b',
  },
  dark: {
    text: '#E8F1E8',              // light text on dark bg
    background: '#1E1F1C',        // deep mossy charcoal
    surface: '#2A2C28',           // elevated card bg
    tint: tintColorDark,          // minty accent
    accent: '#8FCB9B',            // green highlight
    border: '#3A3C36',
    icon: '#A7D7A7',
    tabIconDefault: '#6C786A',
    tabIconSelected: tintColorDark,
    shadow: 'rgba(0, 0, 0, 0.3)',
    disabled: '#4e504b', 
    disabledText: '#ccc'
  },
};

// dynamic colors depending on system mode
export function useAppColors() {
  const scheme = useColorScheme();
  return Colors[scheme ?? 'light'];
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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