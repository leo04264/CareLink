import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { C } from '../theme/tokens';
import { XIcon, ChevRightIcon, ClockIcon } from '../components/Icons';
import Pulse from '../components/Pulse';
import FadeIn from '../components/FadeIn';
import { dismissNotification, markNotificationRead } from '../services/mocks';

function NotifDetail({ notif, onClose }) {
  const typeColor = {
    sos: [C.red, C.redGlow, C.redDim],
    med: [C.amber, C.amberGlow, C.amberDim],
    ok: [C.green, C.greenGlow, C.greenDim],
    health: [C.blue, 'rgba(59,130,246,0.1)', 'rgba(59,130,246,0.28)'],
  };
  const [c, bg, bd] = typeColor[notif.type] || [C.text2, C.card, C.border];

  const details = {
    sos: { icon: '🚨', desc: '媽媽於今天 21:32 觸發了 SOS 緊急按鈕。\n系統已自動通知大哥志明及二姊美玲。\n若情況嚴重請直接撥打 119。', actions: [{ label: '📞 立即撥打', color: C.red }, { label: '查看位置', color: C.text2 }] },
    med: { icon: '💊', desc: '安眠藥（每天 21:00）今天尚未確認服用。\n\n距離提醒時間已過 30 分鐘。請確認長輩是否已服藥，或協助更新紀錄。', actions: [{ label: '標記為已服用', color: C.green }, { label: '延後提醒 1 小時', color: C.amber }] },
    ok: { icon: '😊', desc: '媽媽於今天 09:12 按下了「我很好」按鈕，成功完成今日回報。\n\n連續回報天數：14 天 🎉', actions: [{ label: '回覆留言', color: C.teal }] },
    health: { icon: '📊', desc: '媽媽於昨天 19:05 更新了健康數值。\n\n血壓：126 / 82 mmHg（正常）\n血糖：5.8 mmol/L（正常）\n體溫：36.5°C', actions: [{ label: '查看完整紀錄', color: C.blue }] },
  };
  const d = details[notif.type] || { icon: '🔔', desc: notif.body, actions: [] };
  const typeLabel = { sos: '緊急', med: '藥物', ok: '回報', health: '健康' }[notif.type] || '通知';

  return (
    <FadeIn style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 150 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
        <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <XIcon color={C.text2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: C.text }}>通知詳情</Text>
        <Text style={{ fontSize: 11, color: C.text3 }}>{notif.time}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: bg, borderWidth: 0.5, borderColor: bd, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>{d.icon}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 }}>{notif.title}</Text>
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderWidth: 0.5, borderColor: bd, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
              <View style={{ width: 6, height: 6, backgroundColor: c, borderRadius: 3 }} />
              <Text style={{ fontSize: 11, color: c }}>{typeLabel}</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 13, color: C.text2, lineHeight: 22 }}>{d.desc}</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[{ label: '通知時間', val: notif.time }, { label: '對象', val: '媽媽・張秀蘭' }, { label: '裝置', val: '媽媽的 iPhone' }, { label: '狀態', val: '已送達' }].map((m) => (
            <View key={m.label} style={{ width: '48%', flexGrow: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 11 }}>
              <Text style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>{m.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: C.text }}>{m.val}</Text>
            </View>
          ))}
        </View>

        {d.actions.length > 0 && (
          <View style={{ gap: 8 }}>
            {d.actions.map((a, i) => (
              <Pressable key={i} style={{ padding: 13, borderRadius: 12, backgroundColor: `${a.color}1f`, borderWidth: 0.5, borderColor: `${a.color}55`, alignItems: 'center' }}>
                <Text style={{ color: a.color, fontSize: 14, fontWeight: '600' }}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </FadeIn>
  );
}

export default function NotificationsScreen() {
  const [dismissed, setDismissed] = useState([]);
  const [selected, setSelected] = useState(null);

  const notifs = [
    { id: 1, type: 'sos', title: '⚠️ SOS 緊急通報', body: '媽媽觸發了緊急按鈕，請立即聯繫！', time: '3分鐘前', urgent: true },
    { id: 2, type: 'med', title: '💊 藥物未服用提醒', body: '安眠藥（21:00）尚未確認服用。', time: '30分鐘前', urgent: false },
    { id: 3, type: 'ok', title: '✅ 每日回報', body: '媽媽已完成今日「我很好」回報。', time: '今天 09:12', urgent: false },
    { id: 4, type: 'health', title: '📊 健康數值更新', body: '血壓 126/82 — 在正常範圍內。', time: '昨天 19:05', urgent: false },
    { id: 5, type: 'ok', title: '✅ 每日回報', body: '媽媽已完成每日回報。', time: '昨天 09:08', urgent: false },
    { id: 6, type: 'med', title: '💊 藥物服用完成', body: '降血壓藥與維他命 D 均已服用。', time: '昨天 08:15', urgent: false },
  ];

  const typeColor = {
    sos: [C.red, 'rgba(239,68,68,0.12)', 'rgba(239,68,68,0.25)'],
    med: [C.amber, 'rgba(245,158,11,0.1)', 'rgba(245,158,11,0.25)'],
    ok: [C.green, 'rgba(34,197,94,0.1)', 'rgba(34,197,94,0.22)'],
    health: [C.blue, 'rgba(59,130,246,0.1)', 'rgba(59,130,246,0.25)'],
  };

  const visible = notifs.filter((n) => !dismissed.includes(n.id));
  const selNotif = notifs.find((n) => n.id === selected);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>通知中心</Text>
          <Pressable
            onPress={() => {
              // MOCK: DELETE /api/notifications per id (MOCKS.md #13)
              notifs.forEach((n) => dismissNotification(n.id));
              setDismissed(notifs.map((n) => n.id));
            }}
          >
            <Text style={{ color: C.amber, fontSize: 12 }}>全部清除</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {visible.map((n) => {
            const [c, bg, border] = typeColor[n.type] || [C.text2, C.card, C.border];
            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  markNotificationRead(n.id); // MOCK (MOCKS.md #13)
                  setSelected(n.id);
                }}
                style={{ backgroundColor: bg, borderWidth: 0.5, borderColor: border, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 12, position: 'relative' }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 }}>{n.title}</Text>
                  <Text style={{ fontSize: 12, color: C.text2, lineHeight: 18 }}>{n.body}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                    <ClockIcon color={C.text3} />
                    <Text style={{ fontSize: 11, color: C.text3 }}>{n.time}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      dismissNotification(n.id); // MOCK (MOCKS.md #13)
                      setDismissed((d) => [...d, n.id]);
                    }}
                  >
                    <XIcon color={C.text3} />
                  </Pressable>
                  <ChevRightIcon color={C.text3} />
                </View>
                {n.urgent && (
                  <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, overflow: 'hidden' }}>
                    <Pulse duration={2000} style={{ flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: C.red }} />
                  </View>
                )}
              </Pressable>
            );
          })}

          {visible.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={{ fontSize: 13, color: C.text3 }}>沒有新通知</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {selNotif && <NotifDetail notif={selNotif} onClose={() => setSelected(null)} />}
    </View>
  );
}
