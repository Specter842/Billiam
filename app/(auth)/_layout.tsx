import { Stack } from 'expo-router';
import { useThemeColors } from '@/theme/constants';

export default function AuthLayout() {
  const Colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.paper },
        animation: 'slide_from_right',
      }}
    />
  );
}
