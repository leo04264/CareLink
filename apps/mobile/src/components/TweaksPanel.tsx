import React from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import { C } from '../theme/tokens';
import { useTweaks } from '../context/TweaksContext';
import Toggle from './Toggle';

export default function TweaksPanel({ visible, onClose }) {
  const { tweaks, setTweak } = useTweaks();
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#1a2133', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', padding: 18, paddingBottom: 36, gap: 14 }}>
          <View style={{ width: 36, height: 3, backgroundColor: C.border2, borderRadius: 2, alignSelf: 'center' }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.text3, letterSpacing: 1.5, textTransform: 'uppercase' }}>Tweaks</Text>

          <View>
            <Text style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>強調色</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[['#14b8a6', 'Teal'], ['#f59e0b', 'Amber'], ['#3b82f6', 'Blue'], ['#22c55e', 'Green']].map(([c]) => (
                <Pressable
                  key={c}
                  onPress={() => setTweak('accentColor', c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c,
                    borderWidth: tweaks.accentColor === c ? 2 : 0,
                    borderColor: '#fff',
                  }}
                />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: C.text2 }}>顯示健康數值</Text>
            <Toggle on={tweaks.showHealthPanel} onChange={(v) => setTweak('showHealthPanel', v)} size="sm" />
          </View>

          <View>
            <Text style={{ fontSize: 11, color: C.text2, marginBottom: 8 }}>長輩回報狀態</Text>
            <View style={{ gap: 5 }}>
              {([
                { v: 'ok', label: '✅ 已回報（正常）', color: C.green },
                { v: 'warning', label: '⚠️ 尚未回報（警告）', color: C.amber },
                { v: 'critical', label: '🚨 超過 24 小時（危急）', color: C.red },
              ] as const).map((opt) => {
                const active = tweaks.reportStatus === opt.v;
                return (
                  <Pressable
                    key={opt.v}
                    onPress={() => setTweak('reportStatus', opt.v)}
                    style={{ padding: 10, borderRadius: 8, backgroundColor: active ? `${opt.color}22` : 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: active ? opt.color : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: active ? opt.color : C.text3, fontSize: 12 }}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>長輩姓名</Text>
            <TextInput
              value={tweaks.elderName}
              onChangeText={(v) => setTweak('elderName', v)}
              style={{ padding: 9, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)', color: C.text, fontSize: 13 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
