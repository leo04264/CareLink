import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/tokens';
import { CameraIcon } from '../components/Icons';
import Spin from '../components/Spin';

function ScanLine({ color = C.green, width = 220 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: '50%', marginLeft: -width / 2, top: '30%', width, height: 2, backgroundColor: color, opacity: 0.8, transform: [{ translateY }] }} />
  );
}

export default function ElderMedication({ onBack }) {
  const [phase, setPhase] = useState('ready'); // ready | camera | processing | done
  const [shutterFlash, setShutterFlash] = useState(false);

  const handleShutter = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);
    setTimeout(() => setPhase('processing'), 300);
    setTimeout(() => setPhase('done'), 2200);
  };

  if (phase === 'done') {
    return (
      <LinearGradient colors={['#051a0d', '#0a1a10']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 }}>
        <View style={{ width: 140, height: 140, borderRadius: 20, backgroundColor: '#0a1a0a', borderWidth: 2, borderColor: C.greenDim, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 44 }}>💊</Text>
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(34,197,94,0.9)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, color: '#000', fontWeight: '700' }}>✓ 驗證</Text>
          </View>
        </View>
        <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center' }}>服藥完成！</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 24 }}>照片已儲存{'\n'}家人即時收到通知 ✉️</Text>
        <Pressable onPress={onBack} style={{ marginTop: 16, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: C.greenDim }}>
          <Text style={{ color: C.green, fontSize: 20, fontWeight: '700' }}>返回首頁</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  if (phase === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Shutter flash */}
        {shutterFlash && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: 0.85, zIndex: 50 }} />}

        <View style={{ flex: 1, backgroundColor: '#050a05', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Horizontal scan line animation */}
          <ScanLine />
          {/* viewfinder corners */}
          <View style={{ width: 220, height: 220, position: 'relative' }}>
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
            ].map((p, i) => (
              <View key={i} style={{ position: 'absolute', width: 30, height: 30, borderColor: C.green, ...p }} />
            ))}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 52, marginBottom: 8 }}>💊</Text>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>對準藥物</Text>
              </View>
            </View>
          </View>

          {/* top bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => setPhase('ready')} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>✕</Text>
            </Pressable>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>安眠藥・1 顆</Text>
            </View>
            <View style={{ width: 34 }} />
          </View>
        </View>

        <View style={{ backgroundColor: '#000', paddingVertical: 24, alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>拍下藥物照片作為紀錄</Text>
          <Pressable onPress={handleShutter} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc' }} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'processing') {
    return (
      <View style={{ flex: 1, backgroundColor: '#050a05', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
        <Spin>
          <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(34,197,94,0.2)', borderTopColor: C.green }} />
        </Spin>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 }}>AI 驗證中…</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 22 }}>正在辨識藥物照片{'\n'}請稍候片刻</Text>
        </View>
      </View>
    );
  }

  // READY
  return (
    <LinearGradient colors={['#130f00', '#0a0d14']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 32 }}>
        <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 }}>
          <Text style={{ color: C.text2, fontSize: 13 }}>← 返回</Text>
        </Pressable>

        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20 }}>
          <View style={{ width: 8, height: 8, backgroundColor: C.amber, borderRadius: 4 }} />
          <Text style={{ fontSize: 14, color: '#fbbf24' }}>今天晚上 21:00</Text>
        </View>

        <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', lineHeight: 40, marginBottom: 6 }}>
          該吃<Text style={{ color: '#fbbf24' }}>晚間</Text>的藥了
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>拍下藥物照片，讓家人安心</Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>💊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>安眠藥</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>睡前 30 分鐘服用</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#fbbf24' }}>1 顆</Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: 'rgba(34,197,94,0.05)', borderWidth: 0.5, borderColor: 'rgba(34,197,94,0.15)', borderRadius: 12, padding: 14 }}>
            <Text style={{ fontSize: 11, color: C.green, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 }}>拍照流程說明</Text>
            {[
              ['1', '拿起藥物放在手上'],
              ['2', '對準鏡頭，按下快門'],
              ['3', 'AI 自動辨識，通知家人'],
            ].map(([n, t]) => (
              <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 0.5, borderColor: 'rgba(34,197,94,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, color: C.green, fontWeight: '700' }}>{n}</Text>
                </View>
                <Text style={{ fontSize: 13, color: C.text2 }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 'auto' }}>
          <Pressable onPress={() => setPhase('camera')}>
            <LinearGradient colors={['#166534', '#14532d']} style={{ padding: 20, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <CameraIcon size={24} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>拍照確認服藥</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setPhase('done')} style={{ padding: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>略過拍照，直接確認</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
