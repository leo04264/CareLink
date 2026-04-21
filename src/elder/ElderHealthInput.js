import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/tokens';

function AdjBtn({ label, color, onStart, onStop, size = 76 }) {
  return (
    <Pressable
      onPressIn={onStart}
      onPressOut={onStop}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 2,
        borderColor: `${color}55`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: size === 58 ? 30 : 36, fontWeight: '300' }}>{label}</Text>
    </Pressable>
  );
}

export default function ElderHealthInput({ onBack }) {
  const [mode, setMode] = useState('bp');
  const [bpSys, setBpSys] = useState(120);
  const [bpDia, setBpDia] = useState(80);
  const [bs, setBs] = useState(7.8);
  const [bsCtx, setBsCtx] = useState('post');
  const [saved, setSaved] = useState(false);
  const holdRef = useRef(null);

  const bpStat = () => {
    if (bpSys >= 140 || bpDia >= 90) return { label: '偏高', color: C.red, bg: C.redGlow, bd: C.redDim };
    if (bpSys >= 130 || bpDia >= 80) return { label: '注意', color: C.amber, bg: C.amberGlow, bd: C.amberDim };
    return { label: '正常', color: C.green, bg: C.greenGlow, bd: C.greenDim };
  };
  const bsStat = () => {
    const thr = bsCtx === 'pre' ? 6.1 : bsCtx === 'post' ? 7.8 : 6.9;
    if (bs > thr + 2) return { label: '過高', color: C.red, bg: C.redGlow, bd: C.redDim };
    if (bs > thr) return { label: '偏高', color: C.amber, bg: C.amberGlow, bd: C.amberDim };
    return { label: '正常', color: C.green, bg: C.greenGlow, bd: C.greenDim };
  };
  const stat = mode === 'bp' ? bpStat() : bsStat();

  const startHold = (fn) => {
    fn();
    holdRef.current = setInterval(fn, 120);
  };
  const stopHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
  };
  useEffect(() => () => stopHold(), []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(onBack, 1400);
  };

  return (
    <LinearGradient colors={['#0d1520', '#0a0d14']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ color: C.text2, fontSize: 14 }}>← 返回</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: stat.bg, borderWidth: 0.5, borderColor: stat.bd, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
            <View style={{ width: 9, height: 9, backgroundColor: stat.color, borderRadius: 4.5 }} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: stat.color }}>{stat.label}</Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 5, marginBottom: 18 }}>
          {[['bp', '🩺 血壓'], ['bs', '🩸 血糖']].map(([m, l]) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                setSaved(false);
              }}
              style={{ flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: mode === m ? C.card : 'transparent', borderWidth: 0.5, borderColor: mode === m ? C.border2 : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ color: mode === m ? C.text : C.text3, fontSize: 17, fontWeight: mode === m ? '700' : '400' }}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'bp' && (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BpCol label="收縮壓" hint="（高壓）" value={bpSys} color={C.purpleLight} onUp={() => setBpSys((v) => Math.min(200, v + 1))} onDn={() => setBpSys((v) => Math.max(80, v - 1))} startHold={startHold} stopHold={stopHold} />
              <Text style={{ fontSize: 44, color: 'rgba(168,85,247,0.35)', fontWeight: '300', paddingHorizontal: 2, marginTop: 50 }}>/</Text>
              <BpCol label="舒張壓" hint="（低壓）" value={bpDia} color={C.purpleSoft} onUp={() => setBpDia((v) => Math.min(130, v + 1))} onDn={() => setBpDia((v) => Math.max(40, v - 1))} startHold={startHold} stopHold={stopHold} />
            </View>
            <Text style={{ fontSize: 13, color: C.text3, marginTop: 8 }}>mmHg　· 長按可連續調整</Text>
          </View>
        )}

        {mode === 'bs' && (
          <View style={{ alignItems: 'center', gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
              {[['pre', '空腹'], ['post', '餐後 2 小時'], ['bed', '睡前']].map(([v, l]) => (
                <Pressable key={v} onPress={() => setBsCtx(v)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: bsCtx === v ? C.amberGlow : C.card2, borderWidth: 0.5, borderColor: bsCtx === v ? C.amberDim : C.border, alignItems: 'center' }}>
                  <Text style={{ color: bsCtx === v ? C.amber : C.text3, fontSize: 14, fontWeight: bsCtx === v ? '700' : '400' }}>{l}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <AdjBtn label="+" color="#fcd34d" onStart={() => startHold(() => setBs((v) => Math.round(Math.min(25, v + 0.1) * 10) / 10))} onStop={stopHold} />
              <Text style={{ fontSize: 80, fontWeight: '700', color: '#fcd34d' }}>{bs.toFixed(1)}</Text>
              <AdjBtn label="−" color="#fcd34d" onStart={() => startHold(() => setBs((v) => Math.round(Math.max(2, v - 0.1) * 10) / 10))} onStop={stopHold} />
              <Text style={{ fontSize: 13, color: C.text3 }}>mmol/L　· 長按可連續調整</Text>
            </View>
            <View style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 12, color: C.text3 }}>正常範圍</Text>
                <Text style={{ fontSize: 12, color: stat.color }}>
                  {bsCtx === 'pre' ? '空腹 < 6.1' : bsCtx === 'post' ? '餐後 < 7.8' : '睡前 < 6.9'}
                </Text>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: C.card2, overflow: 'hidden', position: 'relative' }}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '58%', backgroundColor: C.green, opacity: 0.4 }} />
                <View style={{ position: 'absolute', top: -1, bottom: -1, width: 5, borderRadius: 3, backgroundColor: '#fcd34d', left: `${Math.min(92, Math.max(4, ((bs - 2) / 23) * 100))}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: C.text3 }}>4.0</Text>
                <Text style={{ fontSize: 12, color: C.text3 }}>7.0</Text>
                <Text style={{ fontSize: 12, color: C.text3 }}>11.0+</Text>
              </View>
            </View>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 20,
            borderWidth: saved ? 2 : 1.5,
            borderColor: saved ? C.greenDim : mode === 'bp' ? 'rgba(168,85,247,0.4)' : 'rgba(245,158,11,0.4)',
            backgroundColor: saved ? 'rgba(34,197,94,0.12)' : mode === 'bp' ? 'rgba(168,85,247,0.25)' : 'rgba(245,158,11,0.2)',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '900', color: saved ? C.green : mode === 'bp' ? '#d8b4fe' : '#fcd34d' }}>
            {saved ? '✓ 已記錄，通知家人！' : '確認記錄'}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

function BpCol({ label, hint, value, color, onUp, onDn, startHold, stopHold }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{hint}</Text>
      </View>
      <AdjBtn label="+" color={color} size={58} onStart={() => startHold(onUp)} onStop={stopHold} />
      <Text style={{ fontSize: 68, fontWeight: '700', color, minWidth: 96, textAlign: 'center' }}>{value}</Text>
      <AdjBtn label="−" color={color} size={58} onStart={() => startHold(onDn)} onStop={stopHold} />
    </View>
  );
}
