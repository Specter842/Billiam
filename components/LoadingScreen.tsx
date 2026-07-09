import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors, ThemeColors } from '@/theme/constants';

export default function LoadingScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splash-icon.png')}
        style={styles.mark}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color={Colors.royal} style={styles.spinner} />
    </View>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  mark: {
    width: 96,
    height: 96,
  },
  spinner: {
    marginTop: 24,
  },
});
