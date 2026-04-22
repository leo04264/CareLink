import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../theme/tokens';
import Pulse from '../components/Pulse';
import RadialGlow from '../components/RadialGlow';
import { broadcastSOS } from '../services/mocks';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ElderSOS({ onBack }) {
  const [phase, setPhase] = useState('press'); // press | countdown | sent
  const [count, setCount] = useState(3);
  const countRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;

  const startPress = () => {
    setPhase('countdown');
    setCount(3);
    Animated.timing(progress, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false }).start();
    countRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(countRef.current);
          // MOCK: broadcast SOS to emergency contacts (MOCKS.md #3)
          broadcastSOS({
            elderName: '媽媽',
            contacts: [
              { id: 1, name: '大哥 志明', enabled: true },
              { id: 2, name: '二姊 美玲', enabled: true },
            ],
          });
          setPhase('sent');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const cancelPress = () => {
    if (phase !== 'countdown') return;
    if (countRef.current) clearInterval(countRef.current);
    progress.stopAnimation();
    progress.setValue(0);
    setPhase('press');
    setCount(3);
  };

  useEffect(() => () => clearInterval(countRef.current), []);

  const strokeDashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [502, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0505', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
      {/* Red radial gradient background */}
      <RadialGlow color="rgba(239,68,68,0.2)" size={420} style={{ top: '55%', left: '50%', marginTop: -210, marginLeft: -210 }} />
      {phase === 'sent' ? (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 2, borderColor: C.red, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 36 }}>🚨</Text>
          </View>
          <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 8 }}>緊急通報已送出</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, textAlign: 'center' }}>家人正在趕來，請保持冷靜</Text>
          <View style={{ width: 280, gap: 10, marginBottom: 28 }}>
            {['大哥 志明', '二姊 美玲'].map((n) => (
              <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 0.5, borderColor: C.redDim, borderRadius: 12, padding: 12 }}>
                <Pulse duration={1500}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
                </Pulse>
                <Text style={{ flex: 1, fontSize: 14, color: '#fff' }}>{n}</Text>
                <Text style={{ fontSize: 12, color: C.green }}>已通知</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={onBack} style={{ paddingVertical: 14, paddingHorizontal: 36, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>返回</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 32, textAlign: 'center' }}>
            {phase === 'countdown' ? '放開取消，倒數發送' : '長按 SOS 按鈕求助'}
          </Text>
          <View style={{ width: 190, height: 190 }}>
            <Svg width="190" height="190" viewBox="0 0 190 190" style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx="95" cy="95" r="80" fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="8" />
              <AnimatedCircle cx="95" cy="95" r="80" fill="none" stroke={C.red} strokeWidth="8" strokeLinecap="round" strokeDasharray="502" strokeDashoffset={strokeDashoffset} />
            </Svg>
            <Pressable
              onPressIn={startPress}
              onPressOut={cancelPress}
              style={{ position: 'absolute', top: 30, left: 30, width: 130, height: 130, borderRadius: 65, backgroundColor: '#3d1010', borderWidth: 2, borderColor: 'rgba(239,68,68,0.45)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#fca5a5', letterSpacing: 2 }}>SOS</Text>
              {phase === 'countdown' && <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{count}</Text>}
            </Pressable>
          </View>

          {phase === 'press' && (
            <Pressable onPress={onBack} style={{ marginTop: 30 }}>
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>← 返回</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
