import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Colors, Fonts, TypeScale, Spacing, Radius } from '@/theme/constants';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await signUp(email.trim(), password, name.trim(), phone.trim());
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <View style={styles.confirmedContainer}>
        <Text style={styles.confirmedTitle}>Check your email</Text>
        <Text style={styles.confirmedBody}>
          We sent a confirmation link to{' '}
          <Text style={styles.confirmedEmail}>{email}</Text>.
          {'\n\n'}Open it, then sign in below.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable
            id="goto-login-button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Go to Sign In</Text>
          </Pressable>
        </Link>
      </View>
    );
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
        <View style={styles.header}>
          <Text style={styles.wordmark}>Events</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              id="signup-name"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Jane Smith"
              placeholderTextColor={Colors.muted}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              id="signup-email"
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
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              id="signup-phone"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              id="signup-password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.muted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Pressable
            id="signup-button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.paper },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  wordmark: {
    fontFamily: Fonts.displayBold,
    fontSize: 36,
    lineHeight: 44,
    color: Colors.ink,
  },
  tagline: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    marginTop: Spacing.xs,
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
  field: { gap: Spacing.xs },
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
  confirmedContainer: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    backgroundColor: Colors.paper,
    gap: Spacing.lg,
  },
  confirmedTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.display,
    color: Colors.ink,
  },
  confirmedBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
  },
  confirmedEmail: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.ink,
  },
});
