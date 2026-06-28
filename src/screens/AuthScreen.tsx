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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useTheme, font } from '../theme';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { signInWithEmail, signUpWithEmail } from '../lib/auth';
import { track } from '../lib/analytics';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onPrimary = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  const submit = useCallback(async () => {
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError(t('auth.errEmailInvalid'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errPasswordShort'));
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
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(humanizeAuthError(message, t));
    } finally {
      setBusy(false);
    }
  }, [mode, email, password, name, t]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
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
              fontSize: 34,
              fontFamily: font.serif,
              color: theme.colors.th,
              letterSpacing: -0.6,
              marginBottom: 6,
            }}
          >
            {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: theme.colors.tm,
              lineHeight: 22,
              marginBottom: 28,
            }}
          >
            {mode === 'signin' ? t('auth.signInSub') : t('auth.signUpSub')}
          </Text>

          {mode === 'signup' && (
            <>
              <FieldLabel>{t('auth.nameLabel')}</FieldLabel>
              <InputWithIcon
                Icon={UserIcon}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.namePlaceholder')}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!busy}
              />
              <View style={{ height: 14 }} />
            </>
          )}

          <FieldLabel>{t('auth.emailLabel')}</FieldLabel>
          <InputWithIcon
            Icon={Mail}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            editable={!busy}
          />

          <View style={{ height: 14 }} />

          <FieldLabel>{t('auth.passwordLabel')}</FieldLabel>
          <InputWithIcon
            Icon={Lock}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'signup' ? t('auth.passwordPlaceholderSignUp') : t('auth.passwordPlaceholderSignIn')}
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
            title={mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
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
              {mode === 'signin' ? t('auth.switchToSignUpPrefix') : t('auth.switchToSignInPrefix')}
              <Text style={{ color: theme.colors.pu, fontWeight: '700' }}>
                {mode === 'signin' ? t('auth.switchToSignUpLink') : t('auth.switchToSignInLink')}
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
function humanizeAuthError(raw: string, t: TFunction): string {
  const r = raw.toLowerCase();
  if (r.includes('invalid login credentials')) return t('auth.errWrongCreds');
  if (r.includes('user already registered')) return t('auth.errAlreadyRegistered');
  if (r.includes('password should be at least')) return t('auth.errPasswordTooShort');
  if (r.includes('invalid email')) return t('auth.errInvalidEmail');
  if (
    r.includes('for security purposes') ||
    r.includes('email rate limit') ||
    r.includes('over_email_send_rate_limit') ||
    r.includes('rate limit') ||
    r.includes('too many requests')
  ) {
    const seconds = raw.match(/(\d+)\s*seconds?/i)?.[1];
    return seconds
      ? t('auth.errRateLimitWithSeconds', { seconds })
      : t('auth.errRateLimit');
  }
  if (
    r.includes('timed out') ||
    r.includes('timeout') ||
    r.includes('network request failed') ||
    r.includes('fetch failed') ||
    r.includes('failed to fetch') ||
    r.includes('aborterror') ||
    r.includes('network is slow')
  ) {
    return t('auth.errNetworkSlow');
  }
  if (r.includes('network')) return t('auth.errNetwork');
  return raw;
}
