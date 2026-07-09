import { Pressable, Text, StyleSheet } from 'react-native';
import { useThemeMode, ThemeMode } from '@/lib/theme';
import { useThemeColors, ThemeColors } from '@/theme/constants';

const ICONS: Record<ThemeMode, string> = { system: '◐', light: '☀', dark: '☾' };
const NEXT: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' };
const A11Y_LABEL: Record<ThemeMode, string> = {
  system: 'Theme: matching system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

// Cycles system -> light -> dark -> system. Persisted via ThemeModeProvider.
export default function ThemeToggle() {
  const { mode, setMode } = useThemeMode();
  const Colors = useThemeColors();
  const styles = getStyles(Colors);

  return (
    <Pressable
      id="theme-toggle-button"
      onPress={() => setMode(NEXT[mode])}
      hitSlop={12}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={`${A11Y_LABEL[mode]}. Tap to change.`}
    >
      <Text style={styles.icon}>{ICONS[mode]}</Text>
    </Pressable>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  button: {
    marginRight: 16,
    paddingHorizontal: 4,
  },
  icon: {
    fontSize: 20,
    color: Colors.royal,
  },
});
