import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/tokens';
import { ChevRightIcon } from '../components/Icons';
import RadialGlow from '../components/RadialGlow';
import { reportOK } from '../services/mocks';
import { postCheckin } from '../services/checkin';
import { useAuth } from '../context/AuthContext';

export default function ElderHome({ onSOS, onMed, onConfirm, onHealth, onAppt }) {
  const { mode: authMode, elderId } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitError(null);
    try {
      if (authMode === 'live' && elderId) {
        await postCheckin(elderId);
      } else {
        reportOK();
      }
      setConfirmed(true);
      onConfirm && onConfirm();
    } catch (e) {
      // Backend returned non-2xx (e.g. CHECKIN_ALREADY_DONE) or network down.
      setSubmitError((e as Error)?.message || '回報失敗，請稍後再試');
    }
  };

  if (confirmed) {
    return (
      <LinearGradient colors={['#051a0d', '#0a1a10']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
        <RadialGlow color="rgba(34,197,94,0.2)" size={320} style={{ top: '50%', left: '50%', marginTop: -160, marginLeft: -160 }} />
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 2, borderColor: C.greenDim, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 40, color: '#fff' }}>✓</Text>
        </View>
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 }}>已通知家人</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 24 }}>
          今天 {String(new Date().getHours()).padStart(2, '0')}:{String(new Date().getMinutes()).padStart(2, '0')}
          {'\n'}紀錄已儲存
        </Text>
        <Pressable onPress={() => setConfirmed(false)} style={{ marginTop: 40, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: C.greenDim }}>
          <Text style={{ color: C.green, fontSize: 18, fontWeight: '700' }}>返回</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0d1520', '#0a1a12']} style={{ flex: 1, overflow: 'hidden' }}>
      {/* Bottom green glow behind the big button */}
      <RadialGlow color="rgba(34,197,94,0.12)" size={360} style={{ bottom: 180, left: '50%', marginLeft: -180 }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 }}>
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>早安，秀蘭阿嬤 👋</Text>
        </View>

        <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20 }}>
          <View style={{ width: 8, height: 8, backgroundColor: C.amber, borderRadius: 4 }} />
          <Text style={{ fontSize: 14, color: '#fbbf24' }}>今天尚未回報</Text>
        </View>

        {/* Big button */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.15)' }}>
            <Pressable onPress={handleConfirm} style={{ width: 156, height: 156, borderRadius: 78, backgroundColor: '#1a3d2b', borderWidth: 3, borderColor: 'rgba(34,197,94,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>😊</Text>
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>我很好</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>輕按通知家人</Text>
            </Pressable>
          </View>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 14 }}>點一下按鈕回報狀態</Text>
          {submitError && (
            <View style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 0.5, borderColor: C.redDim }}>
              <Text style={{ color: C.red, fontSize: 14, textAlign: 'center' }}>{submitError}</Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Pressable onPress={onHealth} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(168,85,247,0.08)', borderWidth: 0.5, borderColor: 'rgba(168,85,247,0.25)', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 22 }}>🩺</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>量測血壓</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>血糖</Text>
          </Pressable>
          <Pressable onPress={onAppt} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 0.5, borderColor: 'rgba(59,130,246,0.25)', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 22 }}>📅</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>回診行程</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>2 天後</Text>
          </Pressable>
        </View>

        {/* Med reminder */}
        <Pressable onPress={onMed} style={{ padding: 14, borderRadius: 16, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.25)', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 24 }}>💊</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>記錄服藥</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>今天剩 1 種藥未確認</Text>
          </View>
          <ChevRightIcon color="rgba(255,255,255,0.3)" size={14} />
        </Pressable>

        {/* SOS */}
        <Pressable onPress={onSOS} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: C.red, letterSpacing: 2 }}>SOS</Text>
          <Text style={{ fontSize: 14, color: 'rgba(239,68,68,0.7)' }}>緊急求助</Text>
        </Pressable>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 6 }}>長按 3 秒發送緊急通報</Text>
      </ScrollView>
    </LinearGradient>
  );
}
