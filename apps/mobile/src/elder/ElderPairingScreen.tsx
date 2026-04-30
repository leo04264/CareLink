import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/tokens';
import RadialGlow from '../components/RadialGlow';
import { useAuth } from '../context/AuthContext';

// Elder-side first launch in live mode. Big input, big button — sticks
// to the elder app's "minimal + huge text" aesthetic. The pair code is
// 6 chars (alphanumeric, uppercase) per spec §9.

export default function ElderPairingScreen() {
  const { pairElder, error, clearError, setMode } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (code.trim().length < 6) return;
    setSubmitting(true);
    try {
      await pairElder(code);
    } catch {
      // surfaced via context error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0d1520', '#0a1a12']} style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
        <RadialGlow color="rgba(20,184,166,0.12)" size={360} style={{ top: '20%', left: '50%', marginLeft: -180 }} />

        <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 8 }}>請輸入家人提供的</Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 36, letterSpacing: 1 }}>配對碼</Text>

        <TextInput
          value={code}
          onChangeText={(v) => { clearError(); setCode(v.toUpperCase().replace(/\s/g, '')); }}
          placeholder="ABC123"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={{
            fontSize: 44,
            letterSpacing: 12,
            color: '#fff',
            textAlign: 'center',
            paddingVertical: 18,
            borderRadius: 16,
            backgroundColor: 'rgba(20,184,166,0.06)',
            borderWidth: 2,
            borderColor: 'rgba(20,184,166,0.3)',
            fontFamily: 'Syne_700Bold',
            marginBottom: 12,
          }}
        />

        {error && (
          <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 0.5, borderColor: C.redDim }}>
            <Text style={{ color: C.red, fontSize: 16, textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        <Pressable
          onPress={submit}
          disabled={submitting || code.length < 6}
          style={({ pressed }) => ({
            paddingVertical: 18,
            borderRadius: 16,
            backgroundColor: code.length === 6 ? 'rgba(20,184,166,0.18)' : 'rgba(255,255,255,0.04)',
            borderWidth: 1.5,
            borderColor: code.length === 6 ? C.tealDim : 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {submitting ? (
            <ActivityIndicator color={C.teal} size="large" />
          ) : (
            <Text style={{ color: code.length === 6 ? C.teal : 'rgba(255,255,255,0.3)', fontSize: 22, fontWeight: '700' }}>
              開始使用
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode('mock')} style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>← 改用 Demo 模式（不需配對）</Text>
        </Pressable>

        <Text style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 20 }}>
          請家人在子女端 App 點選「設定 → 產生配對碼」
        </Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
