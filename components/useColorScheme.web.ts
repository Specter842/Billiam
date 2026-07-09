import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// The default React Native styling doesn't support server rendering.
// Server rendered styles should not change between the first render of the
// HTML and the first render on the client, so this reports 'light' until
// after hydration, then switches to the real (client-only) color scheme.
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
