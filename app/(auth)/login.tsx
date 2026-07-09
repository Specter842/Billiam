import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, ThemeColors } from '@/theme/constants';

export default function LoginScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Wordmark */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo-mark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.wordmark}>FROSH</Text>
            <Text style={styles.tagline}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                id="login-email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                id="login-password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.muted}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            <Pressable
              id="login-button"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={styles.link}>Create one</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.paper },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: Spacing.base,
  },
  wordmark: {
    fontFamily: Fonts.displayBold,
    fontSize: 36,
    lineHeight: 44,
    color: Colors.ink,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.base,
  },
  errorText: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.error,
    backgroundColor: Colors.errorTint,
    padding: Spacing.sm,
    borderRadius: Radius,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.paper,
  },
  primaryButton: {
    backgroundColor: Colors.royal,
    paddingVertical: Spacing.base,
    borderRadius: Radius,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: Colors.royalPressed,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.paper,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.royal,
  },
});
