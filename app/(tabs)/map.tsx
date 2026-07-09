// Platform split happens one layer down: EventMap.tsx (native, uses
// react-native-maps) vs EventMap.web.tsx (list fallback). Metro's normal
// resolver picks the right one per platform. Keeping react-native-maps out
// of this file matters — expo-router's require.context transforms every
// route file eagerly regardless of platform, so a direct import here would
// break the web bundle even with a map.web.tsx route sitting next to it.
export { default } from '@/components/EventMap';
