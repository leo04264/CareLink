import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme/tokens';
import Pulse from '../../components/Pulse';

export default function PhoneCallOverlay({ name, number, onClose }) {
  const [phase, setPhase] = useState('ringing');
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase('connected'), 2800);
    return () => clearTimeout(t);
  }, []);

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
          {[{ icon: '🔇', label: '靜音' }, { icon: '🔊', label: '擴音' }, { icon: '⌨️', label: '鍵盤' }].map((b) => (
            <View key={b.label} style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{b.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.text2 }}>{b.label}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={hangup} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>📵</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
