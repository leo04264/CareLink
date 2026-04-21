import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/tokens';

export default function ElderAppointmentView({ onBack }) {
  const next = { day: 22, month: 4, time: '上午 10:30', weekday: '星期二', dept: '心臟科複診', hospital: '台大醫院', note: '記得空腹，帶健保卡', daysLeft: 2 };
  const others = [
    { day: 8, month: 5, dept: '年度健檢', hospital: '仁愛醫院', time: '下午 2:00' },
    { day: 20, month: 5, dept: '內分泌科', hospital: '台大醫院', time: '上午 9:00' },
  ];
  return (
    <LinearGradient colors={['#0d1520', '#0a0d14']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
        <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 18 }}>
          <Text style={{ color: C.text2, fontSize: 13 }}>← 返回</Text>
        </Pressable>

        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>秀蘭阿嬤，</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 18 }}>下次回診{'\n'}快到了</Text>

        <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 0.5, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 18, padding: 18, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, color: 'rgba(59,130,246,0.6)', letterSpacing: 1, marginBottom: 8 }}>最近回診</Text>
          <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff' }}>{next.month}月{next.day}日</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{next.weekday}　{next.time}</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#93c5fd', marginTop: 10 }}>{next.dept}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{next.hospital}・{next.note}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: C.amber }}>{next.daysLeft}</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>天後</Text>
          </View>
        </View>

        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 10 }}>其他行程</Text>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {others.map((a, i) => (
            <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 0.5, borderColor: 'rgba(59,130,246,0.22)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', minWidth: 42 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#93c5fd' }}>{a.day}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(59,130,246,0.5)' }}>{a.month}月</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{a.dept}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{a.hospital}・{a.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: 'rgba(34,197,94,0.07)', borderWidth: 0.5, borderColor: 'rgba(34,197,94,0.2)', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 24 }}>志明 會提前提醒您{'\n'}不用擔心忘記 😊</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
