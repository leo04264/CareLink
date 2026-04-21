import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme/tokens';
import { PlusIcon } from '../../components/Icons';
import Pulse from '../../components/Pulse';
import Toggle from '../../components/Toggle';

export default function SOSOverlay({ onClose }) {
  const [phase, setPhase] = useState('notifying'); // notifying | confirm119 | calling119
  const [contacts, setContacts] = useState([
    { id: 1, name: '大哥 志明', phone: '0912-345-678', notified: false, enabled: true, avatar: '👨' },
    { id: 2, name: '二姊 美玲', phone: '0923-456-789', notified: false, enabled: true, avatar: '👩' },
    { id: 3, name: '小弟 建宏', phone: '0934-567-890', notified: false, enabled: false, avatar: '🧑' },
  ]);

  useEffect(() => {
    if (phase !== 'notifying') return;
    const active = contacts.filter((c) => c.enabled);
    const timers = active.map((c, i) =>
      setTimeout(() => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, notified: true } : x))), 800 + i * 900)
    );
    const next = setTimeout(() => setPhase('confirm119'), 800 + active.length * 900 + 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(next);
    };
  }, [phase]);

  const toggleContact = (id) => setContacts((c) => c.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,0,0,0.96)', zIndex: 200 }}>
      <LinearGradient
        colors={['rgba(239,68,68,0.12)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />

      {(phase === 'notifying' || phase === 'confirm119') && (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 2, borderColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>🚨</Text>
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>SOS 警報觸發</Text>
              <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>媽媽已按下緊急按鈕</Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, color: C.text3, letterSpacing: 1.2, marginBottom: 10 }}>緊急聯絡人</Text>

          <View style={{ gap: 8, marginBottom: 16 }}>
            {contacts.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 0.5, borderColor: c.enabled ? C.redDim : 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 11, opacity: c.enabled ? 1 : 0.45 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>{c.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{c.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{c.phone}</Text>
                </View>
                {c.enabled && (
                  <Text style={{ fontSize: 11, color: c.notified ? C.green : C.amber, marginRight: 8 }}>
                    {c.notified ? '✓ 已通知' : '通知中…'}
                  </Text>
                )}
                <Toggle on={c.enabled} onChange={() => toggleContact(c.id)} color={C.red} size="sm" />
              </View>
            ))}

            <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)' }}>
              <PlusIcon color={C.text3} />
              <Text style={{ color: C.text3, fontSize: 12 }}>新增聯絡人</Text>
            </Pressable>
          </View>

          {phase === 'confirm119' && (
            <View style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 6 }}>🚑 是否同時通報 119？</Text>
              <Text style={{ fontSize: 12, color: C.text2, marginBottom: 14, lineHeight: 20 }}>家人已收到通知。若情況緊急，可進一步通報緊急救援。</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setPhase('calling119')} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.red, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>🚑 立即通報 119</Text>
                </Pressable>
                <Pressable onPress={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' }}>
                  <Text style={{ color: C.text2, fontSize: 14 }}>不需要</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {phase === 'calling119' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 2, borderColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>🚑</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>撥打 119 中…</Text>
          <Text style={{ fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 22 }}>請保持冷靜{'\n'}救援人員即將抵達</Text>

          <View style={{ width: '100%', gap: 8, marginTop: 8 }}>
            {contacts.filter((c) => c.enabled).map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 0.5, borderColor: C.redDim, borderRadius: 10, padding: 12 }}>
                <Pulse duration={1500}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.green }} />
                </Pulse>
                <Text style={{ flex: 1, fontSize: 12, color: '#fff' }}>{c.name}</Text>
                <Text style={{ fontSize: 11, color: C.green }}>已通知</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} style={{ marginTop: 12, padding: 12, paddingHorizontal: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: C.text2, fontSize: 14 }}>關閉</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
