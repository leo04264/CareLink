import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { C } from '../theme/tokens';
import { BellIcon, PhoneIcon, MapIcon, CheckIcon, XIcon } from '../components/Icons';
import Pulse from '../components/Pulse';

export default function DashboardScreen({ onSOS, onCall, onMap, goTo, reportStatus = 'warning' }) {
  const [meds, setMeds] = useState([
    { id: 1, name: '降血壓藥', time: '08:00', done: true },
    { id: 2, name: '維他命 D', time: '12:00', done: true },
    { id: 3, name: '安眠藥', time: '21:00', done: false },
  ]);
  const [showNotifPop, setShowNotifPop] = useState(false);

  const toggleMed = (id) => setMeds((m) => m.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const allNotifs = [
    reportStatus === 'critical' && { id: 'c1', type: 'sos', icon: '🚨', title: 'SOS 緊急通報', body: '媽媽觸發了緊急按鈕', time: '3 分鐘前' },
    reportStatus !== 'ok' && { id: 'w1', type: 'warn', icon: '⚠️', title: '今日尚未回報', body: '媽媽還沒按「我很好」', time: '13:12 起' },
    { id: 'n1', type: 'med', icon: '💊', title: '藥物未服用', body: '安眠藥 21:00 尚未確認', time: '30 分鐘前' },
    { id: 'n2', type: 'health', icon: '🩺', title: '血壓更新', body: '126/82 mmHg，在正常範圍', time: '今日 09:12' },
    { id: 'n3', type: 'ok', icon: '✅', title: '每日回報完成', body: '媽媽已按「我很好」', time: '今日 09:12' },
  ].filter(Boolean);
  const dashNotifUnread = reportStatus === 'critical' ? allNotifs.length : Math.min(3, allNotifs.length);

  const statusBadge = {
    ok: { bg: 'rgba(20,184,166,0.12)', border: C.tealDim, dot: C.teal, color: C.teal, label: '我很好', sub: '今天 09:12 回報' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: C.amberDim, dot: C.amber, color: C.amber, label: '尚未回報', sub: '超過 4 小時未回報' },
    critical: { bg: 'rgba(239,68,68,0.12)', border: C.redDim, dot: C.red, color: C.red, label: '⚠️ 失聯警示', sub: '超過 24 小時未回報' },
  }[reportStatus];

  const elderCardBorder = reportStatus === 'critical' ? C.red : reportStatus === 'warning' ? C.amber : C.border2;
  const elderFace = reportStatus === 'critical' ? '😰' : reportStatus === 'warning' ? '🤔' : '👵';
  const elderAvatarBg = reportStatus === 'critical' ? 'rgba(239,68,68,0.1)' : reportStatus === 'warning' ? C.amberGlow : C.tealGlow;

  const activities =
    reportStatus === 'ok'
      ? [
          { color: C.green, text: '媽媽回報「我很好」', time: '今天 09:12' },
          { color: C.amber, text: '晚上藥物尚未服用', time: '今天 21:00' },
          { color: C.blue, text: '健康數值已更新：血壓 126/82', time: '昨天 19:05' },
          { color: C.teal, text: '共享照片：3 張新相片', time: '昨天 15:30' },
        ]
      : reportStatus === 'warning'
      ? [
          { color: C.amber, text: '尚未回報，距離上次回報已超過 4 小時', time: '今天 13:12' },
          { color: C.amber, text: '晚上藥物尚未服用', time: '今天 21:00' },
          { color: C.green, text: '媽媽昨天回報「我很好」', time: '昨天 09:08' },
          { color: C.blue, text: '健康數值已更新：血壓 132/85', time: '昨天 19:05' },
        ]
      : [
          { color: C.red, text: '⚠️ 超過 24 小時未回報，請立即聯繫！', time: '今天 09:00' },
          { color: C.amber, text: '藥物今日全部未服用', time: '今天 21:00' },
          { color: C.red, text: '昨天也未回報，連續兩天無消息', time: '昨天 09:00' },
          { color: C.text3, text: '前天回報「我很好」', time: '前天 09:15' },
        ];

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Critical banner */}
        {reportStatus === 'critical' && (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(239,68,68,0.35)', padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pulse duration={1000}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.red }} />
            </Pulse>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.red }}>媽媽超過 24 小時未回報</Text>
              <Text style={{ fontSize: 11, color: 'rgba(239,68,68,0.65)', marginTop: 1 }}>請立即致電或前往確認狀況</Text>
            </View>
            <Pressable onPress={onSOS} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: C.red }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>立即聯絡</Text>
            </Pressable>
          </View>
        )}

        {/* Warning banner */}
        {reportStatus === 'warning' && (
          <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(245,158,11,0.28)', padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pulse duration={1500}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber }} />
            </Pulse>
            <Text style={{ flex: 1, fontSize: 12, color: '#fbbf24' }}>媽媽今天尚未按下「我很好」</Text>
            <Text style={{ fontSize: 11, color: 'rgba(245,158,11,0.55)' }}>13:12 起</Text>
          </View>
        )}

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: C.amber, letterSpacing: 0.5 }}>
            Care<Text style={{ color: C.text, fontWeight: '500' }}>Link</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pressable
              onPress={() => setShowNotifPop((v) => !v)}
              style={{
                width: 34,
                height: 34,
                backgroundColor: reportStatus === 'critical' ? 'rgba(239,68,68,0.15)' : C.card,
                borderWidth: 0.5,
                borderColor: reportStatus === 'critical' ? C.redDim : C.border,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <BellIcon size={20} color={reportStatus === 'critical' ? C.red : C.text2} />
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 13,
                  height: 13,
                  backgroundColor: reportStatus === 'critical' ? C.red : C.amber,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#000' }}>{dashNotifUnread}</Text>
              </View>
            </Pressable>
            <View style={{ width: 34, height: 34, backgroundColor: C.amberGlow, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.amber }}>志</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {/* Elder status card */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: elderCardBorder, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: elderAvatarBg, borderWidth: 1.5, borderColor: statusBadge.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{elderFace}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>媽媽</Text>
                <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>張秀蘭・75 歲</Text>
              </View>
              <View style={{ marginLeft: 'auto', alignItems: 'flex-end', gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: statusBadge.bg, borderWidth: 0.5, borderColor: statusBadge.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Pulse duration={2000}>
                    <View style={{ width: 7, height: 7, backgroundColor: statusBadge.dot, borderRadius: 3.5 }} />
                  </Pulse>
                  <Text style={{ fontSize: 12, color: statusBadge.color }}>{statusBadge.label}</Text>
                </View>
                <Text style={{ fontSize: 10, color: C.text3, paddingRight: 4 }}>{statusBadge.sub}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: '回報時間', value: reportStatus === 'ok' ? '09:12' : reportStatus === 'warning' ? '昨天' : '—', color: reportStatus === 'ok' ? C.text : reportStatus === 'warning' ? C.amber : C.red },
                { label: '今日步數', value: reportStatus === 'critical' ? '—' : '2,341', color: reportStatus === 'critical' ? C.text3 : C.green },
                { label: '服藥狀況', value: reportStatus === 'critical' ? '0/3' : reportStatus === 'warning' ? '1/3' : '2/3', color: reportStatus === 'critical' ? C.red : C.amber },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 10 }}>
                  <Text style={{ fontSize: 10, color: C.text3, marginBottom: 3, letterSpacing: 0.5 }}>{s.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: s.color }}>{s.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={onCall} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 0.5, borderColor: `${C.teal}40`, backgroundColor: `${C.teal}10`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <PhoneIcon size={16} color={C.teal} />
                <Text style={{ color: C.teal, fontSize: 13, fontWeight: '500' }}>撥打電話</Text>
              </Pressable>
              <Pressable onPress={onMap} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.card2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MapIcon size={16} color={C.text2} />
                <Text style={{ color: C.text2, fontSize: 13, fontWeight: '500' }}>查看位置</Text>
              </Pressable>
            </View>
          </View>

          {/* SOS */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.redDim, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 3 }}>緊急聯絡</Text>
              <Text style={{ fontSize: 11, color: C.text2 }}>長壓 SOS 按鈕即觸發緊急通報</Text>
            </View>
            <Pressable onPress={onSOS} style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.red, letterSpacing: 1 }}>SOS 測試</Text>
            </Pressable>
          </View>

          {/* Meds */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: C.text3, letterSpacing: 1.5 }}>今日用藥</Text>
              <Text style={{ fontSize: 11, color: C.amber }}>{meds.filter((m) => m.done).length}/{meds.length} 完成</Text>
            </View>
            {meds.map((m, i) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: i < meds.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                <View style={{ width: 32, height: 32, backgroundColor: C.amberGlow, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>💊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>{m.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{m.time}</Text>
                </View>
                <Pressable
                  onPress={() => toggleMed(m.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: m.done ? 'rgba(34,197,94,0.12)' : C.card2,
                    borderWidth: 0.5,
                    borderColor: m.done ? C.greenDim : C.border2,
                  }}
                >
                  {m.done && <CheckIcon color={C.green} size={14} />}
                </Pressable>
              </View>
            ))}
          </View>

          {/* Activities */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: C.text3, letterSpacing: 1.5, marginBottom: 12 }}>活動紀錄</Text>
            {activities.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: i < activities.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: a.color, marginTop: 5 }} />
                <Text style={{ flex: 1, fontSize: 12, color: C.text2, lineHeight: 18 }}>{a.text}</Text>
                <Text style={{ fontSize: 11, color: C.text3 }}>{a.time}</Text>
              </View>
            ))}
          </View>

          {/* Health snapshot */}
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: C.text3, letterSpacing: 1.5, marginBottom: 12 }}>健康數值</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: '血壓', value: '126 / 82', unit: 'mmHg', color: C.green, icon: '🩺' },
                { label: '血糖', value: '98', unit: 'mg/dL', color: C.teal, icon: '🩸' },
                { label: '體重', value: '58.5', unit: 'kg', color: C.text2, icon: '⚖️' },
                { label: '體溫', value: '36.5', unit: '°C', color: C.amber, icon: '🌡️' },
              ].map((h) => (
                <View key={h.label} style={{ width: '47%', flexGrow: 1, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Text style={{ fontSize: 14 }}>{h.icon}</Text>
                    <Text style={{ fontSize: 10, color: C.text3, letterSpacing: 0.5 }}>{h.label}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: h.color }}>{h.value}</Text>
                  <Text style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{h.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notification popover */}
      {showNotifPop && (
        <>
          <Pressable onPress={() => setShowNotifPop(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60 }} />
          <View
            style={{
              position: 'absolute',
              top: 62,
              right: 10,
              width: 300,
              maxHeight: 420,
              backgroundColor: 'rgba(16,22,34,0.98)',
              borderWidth: 0.5,
              borderColor: C.border2,
              borderRadius: 14,
              zIndex: 70,
              overflow: 'hidden',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>最新通知</Text>
                <View style={{ backgroundColor: C.amberGlow, borderWidth: 0.5, borderColor: C.amberDim, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 10, color: C.amber, fontWeight: '700' }}>{dashNotifUnread}</Text>
                </View>
              </View>
              <Pressable onPress={() => setShowNotifPop(false)}>
                <XIcon size={14} color={C.text3} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
              {allNotifs.slice(0, 4).map((n) => {
                const tcol = { sos: C.red, warn: C.amber, med: C.amber, health: C.blue, ok: C.green }[n.type];
                const tbg = { sos: 'rgba(239,68,68,0.1)', warn: 'rgba(245,158,11,0.08)', med: 'rgba(245,158,11,0.08)', health: 'rgba(59,130,246,0.08)', ok: 'rgba(34,197,94,0.07)' }[n.type];
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => {
                      setShowNotifPop(false);
                      goTo && goTo('notifications');
                    }}
                    style={{ flexDirection: 'row', gap: 10, padding: 10, borderRadius: 10, backgroundColor: tbg, marginBottom: 4, borderWidth: 0.5, borderColor: `${tcol}33` }}
                  >
                    <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: `${tcol}22`, borderWidth: 0.5, borderColor: `${tcol}44`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 13 }}>{n.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 2 }}>{n.title}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: C.text2 }}>{n.body}</Text>
                      <Text style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{n.time}</Text>
                    </View>
                    {n.type === 'sos' && (
                      <Pulse duration={1000} style={{ marginTop: 8 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
                      </Pulse>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => {
                setShowNotifPop(false);
                goTo && goTo('notifications');
              }}
              style={{ padding: 11, backgroundColor: 'rgba(245,158,11,0.1)', borderTopWidth: 0.5, borderTopColor: C.border, alignItems: 'center' }}
            >
              <Text style={{ color: C.amber, fontSize: 12, fontWeight: '700' }}>查看全部通知 →</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
