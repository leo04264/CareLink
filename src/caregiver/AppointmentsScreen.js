import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { C } from '../theme/tokens';

export default function AppointmentsScreen() {
  const todayD = new Date();
  const [viewMonth, setViewMonth] = useState(todayD.getMonth());
  const [viewYear, setViewYear] = useState(todayD.getFullYear());
  const [selDay, setSelDay] = useState(todayD.getDate());
  const [showDrawer, setShowDrawer] = useState(false);
  const [appts, setAppts] = useState([
    { id: 1, day: 22, month: 4, year: 2026, time: '10:30', dept: '心臟科複診', hospital: '台大醫院', note: '記得空腹，帶健保卡', daysLeft: 2, urgency: 'amber', done: false },
    { id: 2, day: 8, month: 5, year: 2026, time: '14:00', dept: '年度健檢', hospital: '仁愛醫院', note: '全套健檢，需要半天', daysLeft: 18, urgency: 'teal', done: false },
    { id: 3, day: 20, month: 5, year: 2026, time: '09:00', dept: '內分泌科', hospital: '台大醫院', note: '帶上次血糖紀錄', daysLeft: 30, urgency: 'blue', done: false },
  ]);
  const [newDept, setNewDept] = useState('心臟科');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newHosp, setNewHosp] = useState('');
  const [newNote, setNewNote] = useState('');
  const [reminders, setReminders] = useState(['1天前']);

  const depts = ['心臟科', '內分泌科', '骨科', '眼科', '一般科', '其他'];
  const reminderOpts = ['當天', '1天前', '3天前', '1週前'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const apptDays = new Set(
    appts.filter((a) => a.month - 1 === viewMonth && a.year === viewYear && !a.done).map((a) => a.day)
  );

  const urgColor = (a) => (a.done ? C.green : a.urgency === 'amber' ? C.amber : a.urgency === 'teal' ? C.teal : C.blue);
  const markDone = (id) => setAppts((a) => a.map((x) => (x.id === id ? { ...x, done: true } : x)));
  const delAppt = (id) => setAppts((a) => a.filter((x) => x.id !== id));
  const toggleRem = (r) => setReminders((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

  const saveAppt = () => {
    if (!newDate) return;
    const parts = newDate.split('-');
    if (parts.length !== 3) return;
    const [y, m, d] = parts.map((x) => parseInt(x, 10));
    const target = new Date(y, m - 1, d);
    const diff = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
    setAppts((p) => [
      ...p,
      { id: Date.now(), day: d, month: m, year: y, time: newTime, dept: newDept, hospital: newHosp || '待確認', note: newNote, daysLeft: diff, urgency: diff <= 3 ? 'amber' : diff <= 14 ? 'teal' : 'blue', done: false },
    ]);
    setShowDrawer(false);
    setNewDate('');
    setNewHosp('');
    setNewNote('');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* calendar */}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>{viewYear}年 {monthNames[viewMonth]}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[[-1, '‹'], [1, '›']].map(([d, l]) => (
                <Pressable
                  key={d}
                  onPress={() => {
                    let m = viewMonth + d;
                    let y = viewYear;
                    if (m < 0) { m = 11; y--; }
                    if (m > 11) { m = 0; y++; }
                    setViewMonth(m);
                    setViewYear(y);
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: C.text2, fontSize: 16 }}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: C.text3 }}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array(firstDay).fill(null).map((_, i) => (
              <View key={'e' + i} style={{ width: `${100 / 7}%`, height: 30 }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const isToday = d === todayD.getDate() && viewMonth === todayD.getMonth() && viewYear === todayD.getFullYear();
              const hasDot = apptDays.has(d);
              const isSel = d === selDay;
              return (
                <Pressable key={d} onPress={() => setSelDay(d)} style={{ width: `${100 / 7}%`, height: 30, padding: 1.5 }}>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSel ? 'rgba(59,130,246,0.15)' : isToday ? C.card2 : 'transparent',
                      borderWidth: 0.5,
                      borderColor: isSel ? 'rgba(59,130,246,0.3)' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: isSel ? C.blue : isToday ? C.text : C.text3, fontWeight: isToday || isSel ? '700' : '400' }}>{d}</Text>
                    {(hasDot || isToday) && (
                      <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: hasDot ? C.amber : C.blue }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Upcoming */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: C.text2 }}>即將到來的回診</Text>
          <Pressable onPress={() => setShowDrawer(true)} style={{ backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 0.5, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: C.blue, fontSize: 12 }}>+ 新增行程</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {appts.map((a) => (
            <View
              key={a.id}
              style={{
                backgroundColor: a.done ? 'rgba(34,197,94,0.04)' : a.urgency === 'amber' ? C.amberGlow : 'rgba(59,130,246,0.06)',
                borderWidth: 0.5,
                borderColor: `${urgColor(a)}30`,
                borderRadius: 14,
                padding: 12,
                flexDirection: 'row',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                opacity: a.done ? 0.5 : 1,
              }}
            >
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: urgColor(a) }} />
              <View style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center', minWidth: 44, marginLeft: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.text }}>{a.day}</Text>
                <Text style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{a.month}月</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{a.dept}</Text>
                  <Text style={{ fontSize: 10, color: a.done ? C.green : a.daysLeft <= 3 ? C.amber : C.text3 }}>
                    {a.done ? '✓ 完成' : `${a.daysLeft}天後`}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: C.text2, marginBottom: 3 }}>{a.hospital} · {a.time}</Text>
                {a.note && <Text style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>{a.note}</Text>}
                {!a.done && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <Pressable onPress={() => markDone(a.id)} style={{ backgroundColor: C.greenGlow, borderWidth: 0.5, borderColor: C.greenDim, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: C.green, fontSize: 11 }}>標為完成</Text>
                    </Pressable>
                    <Pressable onPress={() => delAppt(a.id)} style={{ backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 }}>
                      <Text style={{ color: C.red, fontSize: 11 }}>刪除</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, fontSize: 12, color: C.text2 }}>過去紀錄</Text>
        <View style={{ marginHorizontal: 16, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
          {[
            { d: '4/3', name: '心臟科複診', note: '血壓控制良好', s: '已完成' },
            { d: '3/18', name: '骨科回診', note: 'X 光正常', s: '已完成' },
            { d: '3/5', name: '年度健檢', note: '血糖稍偏高，需追蹤', s: '需追蹤' },
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: i < 2 ? 0.5 : 0, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 11, color: C.text3, minWidth: 44 }}>{r.d}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>{r.name}</Text>
                <Text style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', marginTop: 1 }}>{r.note}</Text>
              </View>
              <View style={{ backgroundColor: r.s === '需追蹤' ? C.amberGlow : C.greenGlow, borderWidth: 0.5, borderColor: r.s === '需追蹤' ? C.amberDim : C.greenDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: r.s === '需追蹤' ? C.amber : C.green }}>{r.s}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showDrawer} transparent animationType="slide" onRequestClose={() => setShowDrawer(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }} onPress={() => setShowDrawer(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 0.5, borderColor: C.border2, padding: 18, paddingBottom: 36, maxHeight: '85%' }}>
            <ScrollView>
              <View style={{ width: 36, height: 3, backgroundColor: C.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>新增回診行程</Text>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>日期 (YYYY-MM-DD)</Text>
                  <TextInput value={newDate} onChangeText={setNewDate} placeholder="2026-05-01" placeholderTextColor={C.text3} style={input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>時間</Text>
                  <TextInput value={newTime} onChangeText={setNewTime} placeholder="10:00" placeholderTextColor={C.text3} style={input} />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>科別</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {depts.map((d) => (
                    <Pressable key={d} onPress={() => setNewDept(d)} style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: newDept === d ? 'rgba(59,130,246,0.12)' : C.card2, borderWidth: 0.5, borderColor: newDept === d ? 'rgba(59,130,246,0.3)' : C.border2 }}>
                      <Text style={{ fontSize: 12, color: newDept === d ? C.blue : C.text3 }}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>醫院 / 診所</Text>
                <TextInput value={newHosp} onChangeText={setNewHosp} placeholder="例：台大醫院" placeholderTextColor={C.text3} style={input} />
              </View>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 5 }}>備註（給長輩看）</Text>
                <TextInput value={newNote} onChangeText={setNewNote} placeholder="例：記得空腹、帶健保卡" placeholderTextColor={C.text3} style={input} />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>提前提醒</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {reminderOpts.map((r) => (
                    <Pressable key={r} onPress={() => toggleRem(r)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: reminders.includes(r) ? C.amberGlow : C.card2, borderWidth: 0.5, borderColor: reminders.includes(r) ? C.amberDim : C.border2 }}>
                      <Text style={{ fontSize: 12, color: reminders.includes(r) ? C.amber : C.text3 }}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setShowDrawer(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, alignItems: 'center' }}>
                  <Text style={{ color: C.text2, fontSize: 14 }}>取消</Text>
                </Pressable>
                <Pressable onPress={saveAppt} style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)', alignItems: 'center' }}>
                  <Text style={{ color: '#93c5fd', fontSize: 14, fontWeight: '700' }}>儲存行程</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const input = {
  backgroundColor: C.card2,
  borderWidth: 0.5,
  borderColor: C.border2,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 9,
  color: C.text,
  fontSize: 13,
};
