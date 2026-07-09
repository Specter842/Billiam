import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '@/lib/auth';
import { useThemeColors, Fonts, TypeScale, Spacing, Radius, Shadows, ThemeColors } from '@/theme/constants';

const CONTACT_EMAIL = 'hello@events.example.com';
const CONTACT_PHONE = '+91 98765 43210';

export default function ContactScreen() {
  const Colors = useThemeColors();
  const styles = getStyles(Colors);
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'Please fill in all three fields before sending.');
      return;
    }
    setSending(true);
    // Compose a mailto: link — no backend needed for a contact page
    const subject = encodeURIComponent(`Message from ${name}`);
    const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`);
    const url = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);
    setSending(false);
    if (canOpen) {
      Linking.openURL(url);
      setSent(true);
    } else {
      Alert.alert(
        'No email app found',
        `Please email us directly at ${CONTACT_EMAIL}`
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.intro}>
          <Text style={styles.heading}>Get in Touch</Text>
          <Text style={styles.subheading}>
            Questions about the event, registration, or logistics? We're here to help.
          </Text>
        </View>

        {/* Direct contact */}
        <View style={[styles.card, Shadows.card]}>
          <Text style={styles.cardTitle}>Direct Contact</Text>

          <Pressable
            style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityLabel={`Email us at ${CONTACT_EMAIL}`}
          >
            <Text style={styles.contactIcon}>✉</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
            onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)}
            accessibilityLabel={`Call us at ${CONTACT_PHONE}`}
          >
            <Text style={styles.contactIcon}>☎</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>🕐</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Office Hours</Text>
              <Text style={styles.contactValue}>Mon – Fri, 10 AM – 6 PM IST</Text>
            </View>
          </View>
        </View>

        {/* Message form */}
        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentTitle}>Message sent</Text>
            <Text style={styles.sentBody}>
              Your email app opened with a pre-filled message. We'll reply within one business day.
            </Text>
            <Pressable
              id="send-another-button"
              onPress={() => { setSent(false); setMessage(''); }}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
            >
              <Text style={styles.secondaryBtnText}>Send another</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Send a Message</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                id="contact-name"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Jane Smith"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                id="contact-email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                id="contact-message"
                style={[styles.input, styles.textarea]}
                value={message}
                onChangeText={setMessage}
                placeholder="What can we help you with?"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <Pressable
              id="contact-send-button"
              style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
              onPress={handleSend}
              disabled={sending}
            >
              <Text style={styles.sendBtnText}>
                {sending ? 'Opening email app…' : 'Send Message'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  intro: { gap: Spacing.sm },
  heading: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.display,
    color: Colors.ink,
  },
  subheading: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    lineHeight: 24,
  },
  card: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.muted,
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  contactRowPressed: {
    backgroundColor: Colors.royalTint,
  },
  contactIcon: { fontSize: 18 },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontFamily: Fonts.body,
    ...TypeScale.caption,
    color: Colors.muted,
  },
  contactValue: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginLeft: Spacing.base + 18 + Spacing.md,
  },
  form: { gap: Spacing.base },
  formTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
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
  textarea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  sendBtn: {
    backgroundColor: Colors.royal,
    paddingVertical: Spacing.base,
    borderRadius: Radius,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sendBtnPressed: {
    backgroundColor: Colors.royalPressed,
  },
  sendBtnText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.body,
    color: Colors.paper,
  },
  sentBox: {
    gap: Spacing.base,
    padding: Spacing.lg,
    backgroundColor: Colors.royalTint,
    borderRadius: Radius,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sentTitle: {
    fontFamily: Fonts.displayBold,
    ...TypeScale.h2,
    color: Colors.ink,
  },
  sentBody: {
    fontFamily: Fonts.body,
    ...TypeScale.body,
    color: Colors.muted,
    lineHeight: 24,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.royal,
    borderRadius: Radius,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  secondaryBtnPressed: {
    backgroundColor: Colors.paper,
  },
  secondaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    ...TypeScale.caption,
    color: Colors.royal,
  },
});
