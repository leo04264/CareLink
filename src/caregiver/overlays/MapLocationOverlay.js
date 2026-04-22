import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect, Line, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme/tokens';
import { XIcon } from '../../components/Icons';
import Pulse from '../../components/Pulse';
import { fetchElderLocation } from '../../services/mocks';

export default function MapLocationOverlay({ onClose }) {
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    // MOCK: would stream expo-location updates (MOCKS.md #10)
    fetchElderLocation();
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 300 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
        <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <XIcon color={C.text2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>媽媽的位置</Text>
          <Text style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>上次更新：3 分鐘前</Text>
        </View>
        <Pressable onPress={() => setTracking((t) => !t)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tracking ? C.greenGlow : 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: tracking ? C.greenDim : C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Pulse duration={1500} enabled={tracking}>
            <View style={{ width: 6, height: 6, backgroundColor: tracking ? C.green : C.text3, borderRadius: 3 }} />
          </Pulse>
          <Text style={{ fontSize: 11, color: tracking ? C.green : C.text3 }}>{tracking ? '即時追蹤' : '已暫停'}</Text>
        </Pressable>
      </View>

      {/* Map */}
      <View style={{ flex: 1, backgroundColor: '#0d1520', position: 'relative', overflow: 'hidden' }}>
        <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
          <Defs>
            <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <Path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.teal} strokeWidth="0.5" opacity={0.15} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
          <Path d="M 0 220 Q 120 210 190 230 T 375 220" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
          <Path d="M 180 0 Q 190 120 185 230 T 200 450" stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" />
          <Line x1="0" y1="320" x2="375" y2="315" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <SvgText x="30" y="215" fill="rgba(255,255,255,0.18)" fontSize="11">中山北路</SvgText>
          <SvgText x="20" y="318" fill="rgba(255,255,255,0.18)" fontSize="11">南京東路</SvgText>
        </Svg>

        {/* Home marker */}
        <View style={{ position: 'absolute', left: 120, top: 175, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 0.5, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: C.blue }}>🏠 家</Text>
          </View>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.blue, opacity: 0.7 }} />
        </View>

        {/* Elder pin */}
        <View style={{ position: 'absolute', left: 180, top: 220, alignItems: 'center' }}>
          <Pulse duration={1500}>
            <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', top: -6, left: -10 }} />
          </Pulse>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 0 }}>
            <Text style={{ fontSize: 18 }}>👵</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <LinearGradient colors={['transparent', 'rgba(10,13,20,0.98)']} style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 }}>
            <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border2, borderRadius: 14, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenGlow, borderWidth: 1.5, borderColor: C.greenDim, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>👵</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>媽媽・張秀蘭</Text>
                  <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>📍 台北市中山區民生東路三段</Text>
                </View>
                <View style={{ backgroundColor: C.greenGlow, borderWidth: 0.5, borderColor: C.greenDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, color: C.green }}>附近</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 10 }}>
                  <Text style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>距離住家</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: C.green }}>650 m</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 10 }}>
                  <Text style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>停留時間</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>約 25 分</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}
