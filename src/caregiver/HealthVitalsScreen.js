import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import { C } from '../theme/tokens';
import { PlusIcon } from '../components/Icons';

export default function HealthVitalsScreen() {
  const [records, setRecords] = useState([
    { date: '今天 09:15', bp: '120/80', bs: '5.6', ctx: '空腹', bpC: C.green, bsC: C.green },
    { date: '今天 09:20', bp: '—', bs: '7.8', ctx: '餐後', bpC: C.text3, bsC: C.amber },
    { date: '昨天 08:50', bp: '118/76', bs: '6.2', ctx: '餐後', bpC: C.green, bsC: C.green },
    { date: '前天 09:02', bp: '135/88', bs: '—', ctx: '', bpC: C.red, bsC: C.text3 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState('bp');
  const [addSys, setAddSys] = useState('');
  const [addDia, setAddDia] = useState('');
  const [addBs, setAddBs] = useState('');
  const [addCtx, setAddCtx] = useState('空腹');
  const [addSaved, setAddSaved] = useState(false);

  const bpStatus = (s, d) => {
    if (!s || !d) return { c: C.text3 };
    if (+s >= 140 || +d >= 90) return { c: C.red };
    if (+s >= 130 || +d >= 80) return { c: C.amber };
    return { c: C.green };
  };
  const bsStatus = (v) => {
    if (!v) return { c: C.text3 };
    if (+v > 9) return { c: C.red };
    if (+v > 7.8) return { c: C.amber };
    return { c: C.green };
  };

  const saveEntry = () => {
    const now = new Date();
    const timeStr = `今天 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const bp = addMode === 'bp' && addSys && addDia ? `${addSys}/${addDia}` : '—';
    const bs = addMode === 'bs' && addBs ? addBs : '—';
    const ctx = addMode === 'bs' ? addCtx : '';
    const { c: bpC } = bpStatus(addSys, addDia);
    const { c: bsC } = bsStatus(addBs);
    setRecords((r) => [{ date: timeStr, bp, bs, ctx, bpC, bsC }, ...r]);
    setAddSaved(true);
    setTimeout(() => {
      setShowAdd(false);
      setAddSaved(false);
      setAddSys('');
      setAddDia('');
      setAddBs('');
    }, 900);
  };

  const bpData = [
    { d: '日', sys: 126, hi: false },
    { d: '一', sys: 118, hi: false },
    { d: '二', sys: 122, hi: false },
    { d: '三', sys: 135, hi: true },
    { d: '四', sys: 128, hi: false },
    { d: '五', sys: 120, hi: false },
    { d: '六', sys: 124, hi: false },
  ];
  const bsData = [5.6, 7.8, 6.2, 5.8, 7.1, 6.0, 5.9];
  const bpPts = bpData.map((d, i) => `${i * 34 + 17},${50 - (d.sys - 110) * 1.4}`).join(' ');
  const bsPts = bsData.map((v, i) => `${i * 34 + 17},${48 - (v - 3.5) * 8}`).join(' ');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>健康數值</Text>
          <Pressable onPress={() => setShowAdd(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(168,85,247,0.1)', borderWidth: 0.5, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6 }}>
            <PlusIcon size={14} color={C.purpleLight} />
            <Text style={{ color: C.purpleLight, fontSize: 12 }}>手動新增</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {/* BP card */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: C.text2 }}>🩺 血壓</Text>
              <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 0.5, borderColor: 'rgba(34,197,94,0.25)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: C.green }}>● 正常</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: C.purpleLight, fontFamily: 'Syne_700Bold' }}>120</Text>
              <Text style={{ fontSize: 18, color: C.text3, marginBottom: 4 }}>/</Text>
              <Text style={{ fontSize: 24, fontWeight: '500', color: 'rgba(168,85,247,0.65)', fontFamily: 'Syne_500Medium' }}>80</Text>
              <Text style={{ fontSize: 11, color: C.text3, marginLeft: 4, marginBottom: 4 }}>mmHg</Text>
            </View>
            <Text style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>今天 09:15 量測</Text>
            <View style={{ height: 48 }}>
              <Svg width="100%" height="48" viewBox="0 0 240 48" preserveAspectRatio="none">
                <Polyline points={bpPts} fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Polyline points={bpPts} fill="none" stroke={C.purpleLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Line x1="0" y1="18" x2="240" y2="18" stroke="rgba(239,68,68,0.2)" strokeWidth="0.5" strokeDasharray="3 3" />
                <Circle cx={5 * 34 + 17} cy={50 - (120 - 110) * 1.4} r="3" fill={C.purpleLight} />
              </Svg>
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 10, color: C.text3, marginBottom: 6, letterSpacing: 0.5 }}>7 天收縮壓</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44 }}>
                {bpData.map((d, i) => {
                  const h = Math.round(((d.sys - 110) / 45) * 40) + 4;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                      <View style={{ width: '100%', height: h, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: d.hi ? 'rgba(239,68,68,0.55)' : 'rgba(168,85,247,0.4)' }} />
                      <Text style={{ fontSize: 9, color: d.hi ? C.red : C.text3 }}>{d.d}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={{ marginTop: 10, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, color: C.text2, lineHeight: 18 }}>
                正常：收縮壓 &lt;130　舒張壓 &lt;80{'\n'}
                <Text style={{ color: C.amber }}>注意：130–139</Text>　<Text style={{ color: C.red }}>偏高：≥140</Text>
              </Text>
            </View>
          </View>

          {/* BS card */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: C.text2 }}>🩸 血糖</Text>
              <View style={{ backgroundColor: C.amberGlow, borderWidth: 0.5, borderColor: C.amberDim, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: C.amber }}>● 偏高（餐後）</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#fcd34d', fontFamily: 'Syne_700Bold' }}>7.8</Text>
              <Text style={{ fontSize: 14, color: C.text3, marginLeft: 4, marginBottom: 3 }}>mmol/L</Text>
            </View>
            <Text style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>今天 09:20 · 餐後</Text>
            <View style={{ height: 48 }}>
              <Svg width="100%" height="48" viewBox="0 0 240 48" preserveAspectRatio="none">
                <Polyline points={bsPts} fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Polyline points={bsPts} fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={1 * 34 + 17} cy={48 - (7.8 - 3.5) * 8} r="3" fill="#fcd34d" />
              </Svg>
            </View>
            <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: C.text3 }}>正常範圍</Text>
                <Text style={{ fontSize: 10, color: C.text3 }}>餐後 &lt; 7.8</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.card2, position: 'relative', overflow: 'hidden' }}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', backgroundColor: C.green, borderRadius: 3, opacity: 0.4 }} />
                <View style={{ position: 'absolute', top: -1, bottom: -1, width: 3, borderRadius: 2, backgroundColor: '#fcd34d', left: '72%' }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                <Text style={{ fontSize: 10, color: C.text3 }}>4.0</Text>
                <Text style={{ fontSize: 10, color: C.text3 }}>7.0</Text>
                <Text style={{ fontSize: 10, color: C.text3 }}>11.0+</Text>
              </View>
            </View>
          </View>

          {/* Records */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, color: C.text3, letterSpacing: 1.5, marginBottom: 12 }}>統一紀錄</Text>
            <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 8 }}>
              {['時間', '血壓', '血糖', '情境'].map((h) => (
                <Text key={h} style={{ flex: 1, color: C.text3, fontSize: 11 }}>{h}</Text>
              ))}
            </View>
            {records.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < records.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                <Text style={{ flex: 1, color: C.text3, fontSize: 11 }}>{r.date}</Text>
                <Text style={{ flex: 1, color: r.bpC, fontSize: 12, fontWeight: '500' }}>{r.bp}</Text>
                <Text style={{ flex: 1, color: r.bsC, fontSize: 12, fontWeight: '500' }}>{r.bs}</Text>
                <Text style={{ flex: 1, color: C.text3, fontSize: 12 }}>{r.ctx}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }} onPress={() => setShowAdd(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: C.border2, padding: 18, paddingBottom: 36 }}>
            <View style={{ width: 36, height: 3, backgroundColor: C.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>手動新增量測</Text>
            <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 4, marginBottom: 14 }}>
              {[['bp', '🩺 血壓'], ['bs', '🩸 血糖']].map(([m, l]) => (
                <Pressable key={m} onPress={() => setAddMode(m)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: addMode === m ? C.card : 'transparent', alignItems: 'center' }}>
                  <Text style={{ color: addMode === m ? C.text : C.text3, fontSize: 13, fontWeight: addMode === m ? '600' : '400' }}>{l}</Text>
                </Pressable>
              ))}
            </View>

            {addMode === 'bp' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.text3, marginBottom: 5 }}>收縮壓（高壓）</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={addSys}
                    onChangeText={setAddSys}
                    placeholder="120"
                    placeholderTextColor={C.text3}
                    style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 10, padding: 12, color: C.purpleLight, fontSize: 22, fontWeight: '700', textAlign: 'center' }}
                  />
                </View>
                <Text style={{ fontSize: 24, color: C.text3, paddingTop: 20 }}>/</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.text3, marginBottom: 5 }}>舒張壓（低壓）</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={addDia}
                    onChangeText={setAddDia}
                    placeholder="80"
                    placeholderTextColor={C.text3}
                    style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 10, padding: 12, color: C.purpleSoft, fontSize: 22, fontWeight: '700', textAlign: 'center' }}
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {['空腹', '餐後', '睡前'].map((c) => (
                    <Pressable key={c} onPress={() => setAddCtx(c)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: addCtx === c ? C.amberGlow : C.card2, borderWidth: 0.5, borderColor: addCtx === c ? C.amberDim : C.border, alignItems: 'center' }}>
                      <Text style={{ color: addCtx === c ? C.amber : C.text3, fontSize: 13 }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  keyboardType="decimal-pad"
                  value={addBs}
                  onChangeText={setAddBs}
                  placeholder="7.8"
                  placeholderTextColor={C.text3}
                  style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 10, padding: 14, color: '#fcd34d', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}
                />
              </>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, alignItems: 'center' }}>
                <Text style={{ color: C.text2, fontSize: 14 }}>取消</Text>
              </Pressable>
              <Pressable onPress={saveEntry} style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: addSaved ? C.greenGlow : 'rgba(168,85,247,0.15)', borderWidth: 0.5, borderColor: addSaved ? C.greenDim : 'rgba(168,85,247,0.35)', alignItems: 'center' }}>
                <Text style={{ color: addSaved ? C.green : '#d8b4fe', fontSize: 14, fontWeight: '700' }}>{addSaved ? '✓ 已儲存' : '儲存紀錄'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
