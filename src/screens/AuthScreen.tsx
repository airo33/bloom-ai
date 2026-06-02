import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { signInWithEmail, signUpWithEmail } from '../lib/auth';
import { track } from '../lib/analytics';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const submit = useCallback(async () => {
    setError(null);

    // Lightweight client-side validation — Supabase will re-check the rest
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail({ email, password, name });
        track('user_signed_up');
      } else {
        await signInWithEmail(email, password);
        track('user_signed_in');
      }
      // Successful auth flips the session in supabase client → useAuth fires →
      // RootNavigator swaps to the main app. Nothing to do here.
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(humanizeAuthError(message));
    } finally {
      setBusy(false);
    }
  }, [mode, email, password, name]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 22,
            paddingTop: 32,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand mark */}
          <View style={{ marginBottom: 24 }}>
            <Logo size={72} variant="filled" />
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: theme.colors.th,
              letterSpacing: -0.6,
              marginBottom: 6,
            }}
          >
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: theme.colors.tm,
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {mode === 'signin'
              ? 'Sign in to sync your plan across devices.'
              : 'Save your recovery progress to the cloud and access it anywhere.'}
          </Text>

          {mode === 'signup' && (
            <>
              <FieldLabel>Name</FieldLabel>
              <InputWithIcon
                Icon={UserIcon}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!busy}
              />
              <View style={{ height: 14 }} />
            </>
          )}

          <FieldLabel>Email</FieldLabel>
          <InputWithIcon
            Icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            editable={!busy}
          />

          <View style={{ height: 14 }} />

          <FieldLabel>Password</FieldLabel>
          <InputWithIcon
            Icon={Lock}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signup' ? 'new-password' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            editable={!busy}
          />

          {error && (
            <View
              style={{
                backgroundColor: theme.colors.rl,
                borderColor: theme.colors.rb,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 13, color: theme.colors.rd, fontWeight: '600' }}>
                {error}
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />

          <Button
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            onPress={submit}
            loading={busy}
            icon={
              busy ? undefined : <ArrowRight size={18} color={onPrimary} strokeWidth={2.5} />
            }
          />

          <Pressable
            onPress={switchMode}
            disabled={busy}
            style={({ pressed }) => ({
              marginTop: 18,
              alignSelf: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 14, color: theme.colors.tm }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
              <Text style={{ color: theme.colors.pu, fontWeight: '700' }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.tm,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

interface InputWithIconProps extends React.ComponentProps<typeof Input> {
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}

function InputWithIcon({ Icon, ...inputProps }: InputWithIconProps) {
  const theme = useTheme();
  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <View
        // pointerEvents on the View prop (not in style) is the supported
        // way in our RN; without it the icon swallows the tap that should
        // focus the input.
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 14,
          zIndex: 1,
        }}
      >
        <Icon size={18} color={theme.colors.tm} strokeWidth={2} />
      </View>
      <Input {...inputProps} style={{ paddingLeft: 42 }} />
    </View>
  );
}

/** Turn raw Supabase error strings into something readable. */
function humanizeAuthError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('invalid login credentials')) return 'Wrong email or password';
  if (r.includes('user already registered')) return 'This email is already in use — sign in instead';
  if (r.includes('password should be at least')) return 'Password is too short (min 6 characters)';
  if (r.includes('invalid email')) return 'Email looks invalid';
  // Supabase's "for security purposes, you can only request this after N seconds"
  // and any other rate-limit / too-many-requests language.
  if (
    r.includes('for security purposes') ||
    r.includes('email rate limit') ||
    r.includes('over_email_send_rate_limit') ||
    r.includes('rate limit') ||
    r.includes('too many requests')
  ) {
    // Try to surface the cool-down number Supabase included, if any
    const seconds = raw.match(/(\d+)\s*seconds?/i)?.[1];
    return seconds
      ? `Too many attempts — wait ${seconds} seconds and try again`
      : 'Too many attempts — wait a minute and try again';
  }
  // Network conditions — keep the user oriented, hint at the likely fix
  if (
    r.includes('timed out') ||
    r.includes('timeout') ||
    r.includes('network request failed') ||
    r.includes('fetch failed') ||
    r.includes('failed to fetch') ||
    r.includes('aborterror') ||
    r.includes('network is slow')
  ) {
    return 'Network is slow or unreachable — check your connection (or VPN) and try again';
  }
  if (r.includes('network')) return 'Network error — check your connection';
  return raw;
}
