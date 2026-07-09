import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Fonts, ThemeColors } from '@/theme/constants';
import ThemeToggle from './ThemeToggle';

// Rendered once, above the Stack navigator, so it never remounts or
// flickers while switching tabs or pushing/popping screens — always
// visible at the top of the app, the way Amazon's app bar stays put.
export default function AppHeader() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.bar}>
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.wordmark}>FROSH</Text>
        </View>
        <ThemeToggle />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.paper,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 26,
    height: 26,
  },
  wordmark: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
    color: Colors.ink,
  },
});
