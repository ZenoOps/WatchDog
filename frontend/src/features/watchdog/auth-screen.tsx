import { StatusBar } from 'expo-status-bar';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-context';

import { watchdogColors as colors, watchdogRadii as radii } from './theme';

type AuthMode = 'login' | 'signup';

function WatchDogMark() {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.logoEarLeft} />
      <View style={styles.logoEarRight} />
      <View style={styles.logoFace}>
        <View style={styles.logoEyes}>
          <View style={styles.logoEye} />
          <View style={styles.logoEye} />
        </View>
        <View style={styles.logoSignal}>
          <View style={styles.logoSignalBarShort} />
          <View style={styles.logoSignalBar} />
          <View style={styles.logoSignalBarTall} />
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoComplete: 'email' | 'name' | 'current-password' | 'new-password';
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const passwordField = Boolean(secureTextEntry);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <TextInput
          autoCapitalize={autoComplete === 'name' ? 'words' : 'none'}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={!disabled}
          keyboardType={autoComplete === 'email' ? 'email-address' : 'default'}
          multiline={false}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          secureTextEntry={passwordField && !revealed}
          selectionColor={colors.primary}
          showSoftInputOnFocus
          style={styles.input}
          value={value}
        />
        {passwordField ? (
          <Pressable
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setRevealed((current) => !current)}>
            <Text style={styles.showPassword}>{revealed ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
  };

  const submit = async () => {
    const normalizedEmail = email.trim();

    if (mode === 'signup' && !name.trim()) {
      setMessage('Enter your name to create an account.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setMessage('Enter a valid work email.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must contain at least 8 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmation) {
      setMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        await signUp({ name: name.trim(), email: normalizedEmail, password });
      } else {
        await signIn({ email: normalizedEmail, password, remember });
      }
      router.replace('/overview' as Href);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'WatchDog could not authenticate you.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={styles.orbPrimary} />
        <View style={styles.orbBlue} />
        <View style={styles.gridLineOne} />
        <View style={styles.gridLineTwo} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.brandBlock}>
              <WatchDogMark />
              <View>
                <Text style={styles.brandName}>WatchDog</Text>
                <Text style={styles.brandTag}>OBSERVABILITY, ALWAYS ON</Text>
              </View>
            </View>

            <View style={styles.copyBlock}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>All systems operational</Text>
              </View>
              <Text style={styles.title}>
                {mode === 'login' ? 'Welcome back' : 'Start watching your stack'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'login'
                  ? 'Sign in to investigate signals, incidents, and service health.'
                  : 'Create your workspace and bring every signal into one clear view.'}
              </Text>
            </View>

            <View style={styles.card}>
              <View accessibilityRole="tablist" style={styles.modeTabs}>
                {(['login', 'signup'] as const).map((item) => {
                  const active = mode === item;
                  return (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      disabled={submitting}
                      key={item}
                      onPress={() => switchMode(item)}
                      style={[styles.modeTab, active && styles.modeTabActive]}>
                      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
                        {item === 'login' ? 'Log in' : 'Sign up'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.form}>
                {mode === 'signup' ? (
                  <Field
                    autoComplete="name"
                    disabled={submitting}
                    label="Full name"
                    onChangeText={setName}
                    placeholder="Alex Morgan"
                    value={name}
                  />
                ) : null}
                <Field
                  autoComplete="email"
                  disabled={submitting}
                  label="Work email"
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  value={email}
                />
                <Field
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={submitting}
                  label="Password"
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                />
                {mode === 'signup' ? (
                  <Field
                    autoComplete="new-password"
                    disabled={submitting}
                    label="Confirm password"
                    onChangeText={setConfirmation}
                    placeholder="Repeat your password"
                    secureTextEntry
                    value={confirmation}
                  />
                ) : null}

                {mode === 'login' ? (
                  <View style={styles.formActions}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: remember }}
                      disabled={submitting}
                      onPress={() => setRemember((current) => !current)}
                      style={styles.rememberButton}>
                      <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                        {remember ? <Text style={styles.checkmark}>✓</Text> : null}
                      </View>
                      <Text style={styles.secondaryText}>Remember me</Text>
                    </Pressable>
                    <Pressable onPress={() => setMessage('Password recovery is not connected in this UI prototype.')}>
                      <Text style={styles.link}>Forgot password?</Text>
                    </Pressable>
                  </View>
                ) : null}

                {message ? <Text style={styles.message}>{message}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => void submit()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    submitting && styles.disabled,
                    pressed && !submitting && styles.pressed,
                  ]}>
                  <Text style={styles.primaryButtonText}>
                    {submitting
                      ? mode === 'login'
                        ? 'Signing in…'
                        : 'Creating account…'
                      : mode === 'login'
                        ? 'Log in to WatchDog'
                        : 'Create WatchDog account'}
                  </Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </Pressable>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={submitting}
                  onPress={() => setMessage('SSO will be connected in a later backend milestone.')}
                  style={({ pressed }) => [styles.ssoButton, pressed && styles.pressed]}>
                  <View style={styles.ssoIcon}>
                    <Text style={styles.ssoIconText}>S</Text>
                  </View>
                  <Text style={styles.ssoButtonText}>Continue with SSO</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.demoNote}>
              The first signup creates the only WatchDog owner account. Additional signups are disabled.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070A10',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  orbPrimary: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#35210D',
    opacity: 0.62,
    top: -205,
    right: -145,
  },
  orbBlue: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0D1E38',
    opacity: 0.52,
    bottom: -165,
    left: -145,
  },
  gridLineOne: {
    position: 'absolute',
    width: 460,
    height: 1,
    backgroundColor: '#273041',
    opacity: 0.18,
    top: 172,
    left: -80,
    transform: [{ rotate: '-18deg' }],
  },
  gridLineTwo: {
    position: 'absolute',
    width: 480,
    height: 1,
    backgroundColor: '#273041',
    opacity: 0.13,
    bottom: 158,
    right: -110,
    transform: [{ rotate: '-18deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  content: {
    width: '100%',
    maxWidth: 440,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 38,
  },
  logoWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFace: {
    width: 43,
    height: 39,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoEarLeft: {
    position: 'absolute',
    width: 15,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#CA7611',
    left: 0,
    top: 0,
    transform: [{ rotate: '-28deg' }],
  },
  logoEarRight: {
    position: 'absolute',
    width: 15,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#CA7611',
    right: 0,
    top: 0,
    transform: [{ rotate: '28deg' }],
  },
  logoEyes: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 2,
  },
  logoEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#161006',
  },
  logoSignal: {
    height: 10,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  logoSignalBarShort: {
    width: 3,
    height: 4,
    borderRadius: 1,
    backgroundColor: '#161006',
  },
  logoSignalBar: {
    width: 3,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#161006',
  },
  logoSignalBarTall: {
    width: 3,
    height: 10,
    borderRadius: 1,
    backgroundColor: '#161006',
  },
  brandName: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTag: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1.25,
  },
  copyBlock: {
    marginBottom: 24,
  },
  statusPill: {
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#184A3B',
    backgroundColor: '#0C211B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 17,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  statusText: {
    color: '#79D9B8',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 390,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#253142',
    backgroundColor: '#101721',
    padding: 6,
  },
  modeTabs: {
    height: 44,
    padding: 4,
    borderRadius: 15,
    backgroundColor: '#090E16',
    flexDirection: 'row',
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  modeTabActive: {
    backgroundColor: '#1B2533',
    borderWidth: 1,
    borderColor: '#303E50',
  },
  modeTabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: colors.text,
  },
  form: {
    padding: 16,
    gap: 15,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    color: '#C6CFDC',
    fontSize: 12,
    fontWeight: '700',
  },
  inputShell: {
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0A1018',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputShellFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    minHeight: 46,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  showPassword: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#161006',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  link: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  message: {
    color: '#F7A7A7',
    fontSize: 11,
    lineHeight: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#2A161B',
  },
  primaryButton: {
    height: 50,
    borderRadius: 11,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  primaryButtonText: {
    color: '#161006',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonArrow: {
    color: '#161006',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ssoButton: {
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#141C27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ssoIcon: {
    width: 21,
    height: 21,
    borderRadius: 6,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  ssoButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.58,
  },
  demoNote: {
    color: colors.textDim,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
  },
});
