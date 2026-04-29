import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { C } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../services/apiConfig';
import FadeIn from '../components/FadeIn';

// Caregiver login. Shown only in 'live' mode when no session is restored.
// Mock mode skips this screen entirely.

export default function LoginScreen() {
  const { login, register, error, clearError, setMode } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = getApiBaseUrl();

  const submit = async () => {
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch {
      // Error message surfaces via context.
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (t: 'login' | 'register') => {
    if (t === tab) return;
    clearError();
    setTab(t);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }}>
        <FadeIn>
          <Text style={{ fontSize: 32, fontWeight: '700', color: C.amber, letterSpacing: 1, fontFamily: 'Syne_700Bold', textAlign: 'center', marginBottom: 6 }}>CareLink</Text>
          <Text style={{ fontSize: 13, color: C.text2, textAlign: 'center', marginBottom: 28 }}>子女端 · 即時連線</Text>

          <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderRadius: 12, padding: 4, marginBottom: 18, borderWidth: 0.5, borderColor: C.border }}>
            {(['login', 'register'] as const).map((t) => (
              <Pressable key={t} onPress={() => switchTab(t)} style={{ flex: 1, paddingVertical: 9, borderRadius: 9, backgroundColor: tab === t ? C.card : 'transparent', alignItems: 'center', borderWidth: tab === t ? 0.5 : 0, borderColor: C.border2 }}>
                <Text style={{ color: tab === t ? C.text : C.text2, fontWeight: '600', fontSize: 13 }}>{t === 'login' ? '登入' : '註冊'}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'register' && (
            <Field label="姓名" value={name} onChange={setName} placeholder="例：王小明" autoCapitalize="words" />
          )}
          <Field label="電子信箱" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="密碼" value={password} onChange={setPassword} placeholder="至少 8 個字元" secureTextEntry />

          {error && (
            <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim }}>
              <Text style={{ color: C.red, fontSize: 12 }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={submit}
            disabled={submitting || !email || !password || (tab === 'register' && !name)}
            style={({ pressed }) => ({
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              backgroundColor: submitting ? C.tealGlow : 'rgba(20,184,166,0.18)',
              borderWidth: 0.5,
              borderColor: C.tealDim,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {submitting ? (
              <ActivityIndicator color={C.teal} />
            ) : (
              <Text style={{ color: C.teal, fontWeight: '700', fontSize: 14 }}>{tab === 'login' ? '登入' : '建立帳號'}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setMode('mock')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: C.text3, fontSize: 12 }}>← 改用 Demo 模式（不需後端）</Text>
          </Pressable>

          <Text style={{ marginTop: 28, color: C.text3, fontSize: 10, textAlign: 'center' }}>
            連線至 {baseUrl ?? '(未設定)'}
          </Text>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({ label, value, onChange, placeholder, secureTextEntry, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.text3}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 11,
          borderRadius: 10,
          backgroundColor: C.card2,
          borderWidth: 0.5,
          borderColor: C.border,
          color: C.text,
          fontSize: 14,
        }}
      />
    </View>
  );
}
