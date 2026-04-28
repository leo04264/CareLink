import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme/tokens';
import Pulse from '../../components/Pulse';
import RippleRings from '../../components/RippleRings';
import { dial } from '../../services/mocks';

function notImplemented(title) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
    window.alert(`${title}\n\n此功能尚未實作（MOCK）`);
    return;
  }
  Alert.alert(title, '此功能尚未實作（MOCK）', [{ text: '了解' }]);
}

export default function PhoneCallOverlay({ name, number, onClose }) {
  const [phase, setPhase] = useState('ringing');
  const [seconds, setSeconds] = useState(0);
  // Local UI-only toggles for the 3 in-call controls. The underlying call is
  // mocked, so these don't actually mute audio or route to speaker — they
  // only flip the button's visual state.
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // MOCK: would `Linking.openURL('tel:...')` on real device (MOCKS.md #2)
    dial(number);
    const t = setTimeout(() => setPhase('connected'), 2800);
    return () => clearTimeout(t);
  }, [number]);

  useEffect(() => {
    if (phase === 'connected') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const hangup = () => {
    setPhase('ended');
    setTimeout(onClose, 900);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300 }}>
      <LinearGradient colors={['#0d1a0f', '#0a0d14']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 56, paddingBottom: 56 }}>
        {/* Expanding ring halo behind avatar */}
        <RippleRings color="rgba(34,197,94,0.35)" count={3} size={160} step={60} duration={2400} style={{ top: '28%' }} />

        <View style={{ alignItems: 'center', gap: 6, marginTop: 20 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 40 }}>👵</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>{name}</Text>
          <Text style={{ fontSize: 13, color: C.text3 }}>{number}</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: phase === 'connected' ? C.green : C.text2 }}>
            {phase === 'ringing' ? '撥號中…' : phase === 'connected' ? fmt(seconds) : '通話結束'}
          </Text>
          {phase === 'connected' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.greenGlow, borderWidth: 0.5, borderColor: C.greenDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Pulse duration={1000}>
                <View style={{ width: 6, height: 6, backgroundColor: C.green, borderRadius: 3 }} />
              </Pulse>
              <Text style={{ fontSize: 11, color: C.green }}>通話中</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 28 }}>
          {[
            { key: 'mute', icon: '🔇', label: '靜音', active: muted, onPress: () => setMuted((v) => !v) },
            { key: 'speaker', icon: '🔊', label: '擴音', active: speaker, onPress: () => setSpeaker((v) => !v) },
            { key: 'keypad', icon: '⌨️', label: '鍵盤', active: false, onPress: () => notImplemented('撥號鍵盤') },
          ].map((b) => (
            <Pressable key={b.key} onPress={b.onPress} style={{ alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: b.active ? '#fff' : 'rgba(255,255,255,0.08)',
                  borderWidth: 0.5,
                  borderColor: b.active ? '#fff' : 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>{b.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, color: b.active ? '#fff' : C.text2 }}>{b.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={hangup} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>📵</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
