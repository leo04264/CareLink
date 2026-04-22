import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { C } from '../theme/tokens';
import { PlusIcon } from '../components/Icons';
import Toggle from '../components/Toggle';
import Pulse from '../components/Pulse';
import Chevron from '../components/Chevron';

export default function MedicationsScreen() {
  const today = new Date();
  const todayIdx = today.getDay();
  const [selIdx, setSelIdx] = useState(todayIdx);
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('1 顆');
  const [newTime, setNewTime] = useState('08:00');
  const [newNote, setNewNote] = useState('');
  const [newColor, setNewColor] = useState(C.amber);

  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const colorOpts = [C.purple, C.blue, C.teal, C.amber, C.green, C.red];

  const [meds, setMeds] = useState([
    { id: 1, name: '降血壓藥（脈優錠）', dose: '1 顆', slots: [{ time: '08:00', meal: '早餐後', on: true }], note: '飯後服用，勿空腹。若有頭暈感請告知醫師。', color: C.purple, active: true },
    { id: 2, name: '鈣片', dose: '2 顆', slots: [{ time: '08:30', meal: '早餐後・1 顆', on: true }, { time: '12:30', meal: '午餐後・1 顆', on: true }], note: '飯中服用，搭配充足水分。', color: C.blue, active: true },
    { id: 3, name: 'Metformin 二甲雙胍', dose: '500mg', slots: [{ time: '08:00', meal: '早餐後・500mg', on: true }, { time: '12:00', meal: '午餐後・500mg', on: true }, { time: '18:00', meal: '晚餐後・500mg', on: true }], note: '飯後服用，與食物同服可減少腸胃不適。', color: C.teal, active: true, missedToday: true },
    { id: 4, name: '阿斯匹靈', dose: '1 顆', slots: [{ time: '21:00', meal: '睡前', on: true }], note: '手術前停藥，預計 5/10 後恢復。', color: C.text3, active: false, pauseReason: '手術前停藥，預計 5/10 後恢復' },
  ]);

  const dayData = {
    [todayIdx]: [{ done: true }, { done: true }, { done: false }, { done: true, done2: false }],
    [(todayIdx + 6) % 7]: [{ done: true }, { done: true }, { done: true }, { done: true, done2: true }],
    [(todayIdx + 5) % 7]: [{ done: true }, { done: false }, { done: true }, { done: true, done2: false }],
    [(todayIdx + 4) % 7]: [{ done: false }, { done: true }, { done: true }, { done: true, done2: true }],
    [(todayIdx + 3) % 7]: [{ done: true }, { done: true }, { done: true }, { done: true, done2: true }],
    [(todayIdx + 2) % 7]: [{ done: true }, { done: true }, { done: false }, { done: true, done2: false }],
    [(todayIdx + 1) % 7]: [{ done: true }, { done: true }, { done: true }, { done: true, done2: true }],
  };

  const curData = dayData[selIdx] || meds.map(() => ({ done: false }));
  const doneCount = curData.filter((d) => d.done).length + curData.filter((d) => d.done2).length;
  const totalDoses = meds.filter((m) => m.active).reduce((s, m) => s + m.slots.filter((x) => x.on).length, 0);
  const activeCount = meds.filter((m) => m.active).length;
  const compliance = Math.round((doneCount / Math.max(1, totalDoses)) * 100);
  const missedCount = meds.filter((m) => m.missedToday && m.active).length;

  const delMed = (id) => setMeds((m) => m.filter((x) => x.id !== id));
  const toggleActive = (id) => setMeds((m) => m.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  const toggleSlot = (mid, si) =>
    setMeds((ms) => ms.map((m) => (m.id === mid ? { ...m, slots: m.slots.map((s, i) => (i === si ? { ...s, on: !s.on } : s)) } : m)));
  const delSlot = (mid, si) => setMeds((ms) => ms.map((m) => (m.id === mid ? { ...m, slots: m.slots.filter((_, i) => i !== si) } : m)));

  const addMed = () => {
    if (!newName) return;
    setMeds((m) => [
      ...m,
      { id: Date.now(), name: newName, dose: newDose, slots: [{ time: newTime, meal: '早餐後', on: true }], note: newNote, color: newColor, active: true },
    ]);
    setShowAddForm(false);
    setNewName('');
    setNewNote('');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>服藥管理</Text>
            <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>張秀蘭・目前 {activeCount} 種藥物</Text>
          </View>
          <Pressable onPress={() => setShowAddForm(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.amberGlow, borderWidth: 0.5, borderColor: C.amberDim, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6 }}>
            <PlusIcon size={14} color={C.amber} />
            <Text style={{ color: C.amber, fontSize: 12 }}>新增藥物</Text>
          </Pressable>
        </View>

        {/* missed banner */}
        {missedCount > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 0.5, borderColor: C.redDim, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pulse duration={1500}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.red }} />
            </Pulse>
            <Text style={{ flex: 1, fontSize: 12, color: '#fca5a5' }}>
              今日有 <Text style={{ fontWeight: '700', color: C.red }}>{missedCount}</Text> 種藥物漏服！已超過 2 小時，建議不補服。
            </Text>
          </View>
        )}

        {/* summary */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          {[
            { n: activeCount, l: '目前藥物', c: C.amber },
            { n: totalDoses, l: '每日提醒次', c: C.green },
            { n: `${compliance}%`, l: '本週服藥率', c: C.blue },
          ].map((s) => (
            <View key={s.l} style={{ flex: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 12, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: s.c }}>{s.n}</Text>
              <Text style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* week calendar */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 5, marginBottom: 12 }}>
          {days.map((d, i) => {
            const isToday = i === todayIdx;
            const isSel = i === selIdx;
            const dayCompliance = dayData[i] || [];
            const allDone = dayCompliance.length > 0 && dayCompliance.every((x) => x.done);
            const dateNum = new Date(Date.now() - (todayIdx - i) * 86400000).getDate();
            return (
              <Pressable key={d} onPress={() => setSelIdx(i)} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: isSel ? C.amber : C.card, borderWidth: 0.5, borderColor: isSel ? C.amber : C.border }}>
                <Text style={{ fontSize: 9, color: isSel ? 'rgba(0,0,0,0.6)' : C.text3 }}>周{d}</Text>
                <Text style={{ fontSize: 13, fontWeight: isSel || isToday ? '700' : '400', color: isSel ? '#000' : C.text }}>{dateNum}</Text>
                {allDone && !isSel && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green }} />}
                {isToday && !isSel && !allDone && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.blue }} />}
              </Pressable>
            );
          })}
        </View>

        {/* med cards */}
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {meds.map((m, mi) => {
            const d = curData[mi] || { done: false };
            const isOpen = expanded === m.id;
            const paused = !m.active;
            const missed = m.missedToday && m.active;
            const slotStatus = (si) => {
              if (paused) return 'paused';
              if (missed && si === 1) return 'missed';
              if (si === 0) return 'done';
              if (si >= m.slots.length - 1 && selIdx === todayIdx) return 'pending';
              return 'done';
            };
            const borderCol = isOpen ? `${m.color}55` : missed ? C.redDim : C.border;
            return (
              <View key={m.id} style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: borderCol, borderRadius: 14, overflow: 'hidden', opacity: paused ? 0.55 : 1 }}>
                <Pressable onPress={() => setExpanded(isOpen ? null : m.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
                  <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: paused ? C.text3 : m.color }} />
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: paused ? 'rgba(255,255,255,0.04)' : `${m.color}22`, borderWidth: 0.5, borderColor: paused ? C.border : `${m.color}40`, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>💊</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: paused ? C.text2 : C.text }}>
                      {m.name}
                      {paused && <Text style={{ fontSize: 11, color: C.text3, fontWeight: '400' }}>（暫停）</Text>}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <View style={{ backgroundColor: paused ? 'rgba(255,255,255,0.06)' : C.greenGlow, borderWidth: 0.5, borderColor: paused ? C.border : C.greenDim, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 1 }}>
                        <Text style={{ color: paused ? C.text3 : C.green, fontSize: 10, fontWeight: '600' }}>{paused ? '已暫停' : '啟用中'}</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: C.text2 }}>
                        每日 {m.slots.length} 次・{m.slots[0]?.meal?.split('・')[0] || ''}
                      </Text>
                    </View>
                  </View>
                  <Chevron open={isOpen} size={14} color={C.text3} />
                </Pressable>

                {isOpen && (
                  <View style={{ borderTopWidth: 0.5, borderTopColor: C.border, padding: 12 }}>
                    {paused ? (
                      <View style={{ backgroundColor: C.card2, borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 12, color: C.text3 }}>
                          <Text style={{ color: C.text2, fontWeight: '600' }}>暫停原因：</Text>
                          {m.pauseReason || '—'}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={{ fontSize: 10, color: C.text3, letterSpacing: 1.2, marginBottom: 6 }}>今日服藥狀況</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                          {m.slots.map((s, si) => {
                            const st = slotStatus(si);
                            const cfg = {
                              done: { bg: C.greenGlow, border: C.greenDim, color: C.green, label: '✓' },
                              missed: { bg: 'rgba(239,68,68,0.1)', border: C.redDim, color: C.red, label: '✕' },
                              pending: { bg: C.card2, border: C.border, color: C.text3, label: '—' },
                              paused: { bg: C.card2, border: C.border, color: C.text3, label: '—' },
                            }[st];
                            const lbl = ['早', '中', '晚', '宵'][si] || `#${si + 1}`;
                            return (
                              <View key={si} style={{ alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: cfg.bg, borderWidth: 0.5, borderColor: cfg.border }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
                                </View>
                                <Text style={{ fontSize: 10, color: C.text3 }}>{lbl}</Text>
                              </View>
                            );
                          })}
                        </View>
                        {missed && (
                          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, padding: 8, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 0.5, borderColor: C.redDim, borderRadius: 8 }}>
                            <Text style={{ fontSize: 13 }}>⚠️</Text>
                            <Text style={{ flex: 1, fontSize: 12, color: '#fca5a5', lineHeight: 18 }}>今日中午漏服！已超過 2 小時，建議不補服。</Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 10, color: C.text3, letterSpacing: 1.2, marginBottom: 6 }}>提醒時間</Text>
                        {m.slots.map((s, si) => (
                          <View key={si} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 8, padding: 8, marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{s.time}</Text>
                            <Text style={{ flex: 1, fontSize: 11, color: C.text3, marginLeft: 6 }}>{s.meal}</Text>
                            <Toggle on={s.on} size="sm" color={C.green} onChange={() => toggleSlot(m.id, si)} />
                            <Pressable onPress={() => delSlot(m.id, si)} style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 0.5, borderColor: C.redDim, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: C.red, fontSize: 10 }}>✕</Text>
                            </Pressable>
                          </View>
                        ))}
                      </>
                    )}

                    {m.note && !paused && (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, padding: 8, backgroundColor: missed ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', borderWidth: 0.5, borderColor: missed ? C.redDim : C.amberDim, borderRadius: 8 }}>
                        <Text style={{ fontSize: 14 }}>ℹ️</Text>
                        <Text style={{ flex: 1, fontSize: 12, color: C.text2, lineHeight: 18 }}>{m.note}</Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: C.border }}>
                      <Pressable onPress={() => toggleActive(m.id)} style={{ flex: 1, padding: 7, borderRadius: 8, backgroundColor: paused ? C.greenGlow : C.amberGlow, borderWidth: 0.5, borderColor: paused ? C.greenDim : C.amberDim, alignItems: 'center' }}>
                        <Text style={{ color: paused ? C.green : C.amber, fontSize: 11 }}>{paused ? '▶ 恢復提醒' : '❚❚ 暫停提醒'}</Text>
                      </Pressable>
                      <Pressable onPress={() => delMed(m.id)} style={{ flex: 1, padding: 7, borderRadius: 8, backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim, alignItems: 'center' }}>
                        <Text style={{ color: C.red, fontSize: 11 }}>🗑 刪除</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showAddForm} transparent animationType="slide" onRequestClose={() => setShowAddForm(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }} onPress={() => setShowAddForm(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: C.border2, padding: 18, paddingBottom: 36 }}>
            <View style={{ width: 36, height: 3, backgroundColor: C.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>新增藥物</Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5, letterSpacing: 0.5 }}>藥物名稱 *</Text>
              <TextInput value={newName} onChangeText={setNewName} placeholder="例：降血壓藥（脈優錠）" placeholderTextColor={C.text3} style={inputStyle} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>劑量</Text>
                <TextInput value={newDose} onChangeText={setNewDose} placeholder="1 顆" placeholderTextColor={C.text3} style={inputStyle} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>提醒時間</Text>
                <TextInput value={newTime} onChangeText={setNewTime} placeholder="08:00" placeholderTextColor={C.text3} style={inputStyle} />
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>顏色標記</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {colorOpts.map((c) => (
                  <Pressable key={c} onPress={() => setNewColor(c)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: newColor === c ? 2.5 : 2, borderColor: newColor === c ? '#fff' : 'transparent' }} />
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>備註</Text>
              <TextInput value={newNote} onChangeText={setNewNote} placeholder="例：飯後服用，勿空腹" placeholderTextColor={C.text3} style={inputStyle} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setShowAddForm(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, alignItems: 'center' }}>
                <Text style={{ color: C.text2, fontSize: 14 }}>取消</Text>
              </Pressable>
              <Pressable onPress={addMed} style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: C.amberGlow, borderWidth: 1, borderColor: C.amberDim, alignItems: 'center' }}>
                <Text style={{ color: C.amber, fontSize: 14, fontWeight: '700' }}>新增藥物</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const inputStyle = {
  backgroundColor: C.card2,
  borderWidth: 0.5,
  borderColor: C.border2,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: C.text,
  fontSize: 14,
};
