import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { C } from '../theme/tokens';
import Toggle from '../components/Toggle';
import { ChevRightIcon, XIcon, PlusIcon } from '../components/Icons';

function SettingSubPage({ title, onBack, children }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg, zIndex: 150 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
        <Pressable onPress={onBack} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <XIcon color={C.text2} />
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>{children}</ScrollView>
    </View>
  );
}

function SubElderProfile({ onBack }) {
  const [name, setName] = useState('張秀蘭');
  const [age, setAge] = useState('75');
  const [relation, setRelation] = useState('媽媽');
  const [saved, setSaved] = useState(false);
  const relations = ['媽媽', '爸爸', '奶奶', '爺爺', '其他'];
  return (
    <SettingSubPage title="長輩端資料" onBack={onBack}>
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 20, backgroundColor: C.card, borderRadius: 14, borderWidth: 0.5, borderColor: C.border }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.tealGlow, borderWidth: 2, borderColor: C.tealDim, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32 }}>👵</Text>
          </View>
          <Text style={{ fontSize: 14, color: C.text2 }}>長輩頭像</Text>
        </View>
        {[['姓名', name, setName], ['年齡', age, setAge], ['稱謂', relation, setRelation]].map(([lbl, val, setter]) => (
          <View key={lbl}>
            <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{lbl}</Text>
            <TextInput value={val} onChangeText={setter} style={input} placeholderTextColor={C.text3} />
          </View>
        ))}
        <View>
          <Text style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>與您的關係</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {relations.map((r) => (
              <Pressable key={r} onPress={() => setRelation(r)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: relation === r ? C.tealGlow : C.card2, borderWidth: 0.5, borderColor: relation === r ? C.tealDim : C.border }}>
                <Text style={{ fontSize: 13, color: relation === r ? C.teal : C.text3 }}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          onPress={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          style={{ padding: 13, borderRadius: 12, backgroundColor: saved ? C.greenGlow : 'rgba(59,130,246,0.12)', borderWidth: 0.5, borderColor: saved ? C.greenDim : 'rgba(59,130,246,0.3)', alignItems: 'center' }}
        >
          <Text style={{ color: saved ? C.green : '#93c5fd', fontSize: 14, fontWeight: '600' }}>{saved ? '✓ 已儲存' : '儲存變更'}</Text>
        </Pressable>
      </View>
    </SettingSubPage>
  );
}

function SubNotifSettings({ onBack }) {
  const [settings, setSettings] = useState({ sos: true, medMissed: true, medDone: true, dailyReport: true, health: false, location: false, quietHourOn: true });
  const toggle = (k) => setSettings((s) => ({ ...s, [k]: !s[k] }));
  const rows = [
    { k: 'sos', icon: '🚨', label: 'SOS 緊急通報', sub: '觸發後立即推播', urgent: true },
    { k: 'medMissed', icon: '💊', label: '藥物未服用提醒', sub: '超過服藥時間未確認' },
    { k: 'medDone', icon: '✅', label: '藥物服用完成', sub: '長輩確認服藥後通知' },
    { k: 'dailyReport', icon: '😊', label: '每日我很好回報', sub: '長輩回報狀態時通知' },
    { k: 'health', icon: '📊', label: '健康數值更新', sub: '量測血壓血糖後通知' },
    { k: 'location', icon: '📍', label: '位置異常', sub: '長輩移動超出習慣範圍' },
  ];
  return (
    <SettingSubPage title="通知設定" onBack={onBack}>
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderBottomWidth: i < rows.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: r.urgent && settings[r.k] ? C.red : C.text }}>{r.label}</Text>
                <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>{r.sub}</Text>
              </View>
              <Toggle on={settings[r.k]} onChange={() => toggle(r.k)} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 14, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>🌙 勿擾時段</Text>
              <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>此時段內僅 SOS 會通知</Text>
            </View>
            <Toggle on={settings.quietHourOn} onChange={() => toggle('quietHourOn')} />
          </View>
        </View>
      </View>
    </SettingSubPage>
  );
}

function SubContacts({ onBack }) {
  const [contacts, setContacts] = useState([
    { id: 1, name: '大哥 志明', phone: '0912-345-678', relation: '長子', priority: 1, active: true },
    { id: 2, name: '二姊 美玲', phone: '0923-456-789', relation: '長女', priority: 2, active: true },
    { id: 3, name: '小弟 建宏', phone: '0934-567-890', relation: '次子', priority: 3, active: false },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('');

  const toggle = (id) => setContacts((c) => c.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
  const del = (id) => setContacts((c) => c.filter((x) => x.id !== id));
  const add = () => {
    if (!newName || !newPhone) return;
    setContacts((c) => [...c, { id: Date.now(), name: newName, phone: newPhone, relation: newRel || '家人', priority: c.length + 1, active: true }]);
    setNewName('');
    setNewPhone('');
    setNewRel('');
    setShowAdd(false);
  };

  return (
    <SettingSubPage title="緊急聯絡人" onBack={onBack}>
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 11, color: C.text3, lineHeight: 18 }}>SOS 觸發時，依優先順序通知以下聯絡人。可開關各聯絡人的通知。</Text>
        </View>

        {contacts.map((c) => (
          <View key={c.id} style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: c.active ? C.border2 : C.border, borderRadius: 14, padding: 13, flexDirection: 'row', gap: 12, alignItems: 'center', opacity: c.active ? 1 : 0.5 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.active ? C.tealGlow : 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: c.active ? C.tealDim : C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: c.active ? C.teal : C.text3 }}>{c.priority}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{c.name}</Text>
              <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>{c.phone} · {c.relation}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Toggle on={c.active} onChange={() => toggle(c.id)} />
              <Pressable onPress={() => del(c.id)} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim, alignItems: 'center', justifyContent: 'center' }}>
                <XIcon color={C.red} />
              </Pressable>
            </View>
          </View>
        ))}

        {showAdd ? (
          <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border2, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 12 }}>新增聯絡人</Text>
            {[['姓名 *', newName, setNewName, '例：三弟 志遠'], ['電話 *', newPhone, setNewPhone, '0912-000-000'], ['關係', newRel, setNewRel, '例：次子']].map(([lbl, val, setter, ph]) => (
              <View key={lbl} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>{lbl}</Text>
                <TextInput value={val} onChangeText={setter} placeholder={ph} placeholderTextColor={C.text3} style={input} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable onPress={() => setShowAdd(false)} style={{ flex: 1, padding: 10, borderRadius: 8, backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border, alignItems: 'center' }}>
                <Text style={{ color: C.text2, fontSize: 13 }}>取消</Text>
              </Pressable>
              <Pressable onPress={add} style={{ flex: 2, padding: 10, borderRadius: 8, backgroundColor: 'rgba(20,184,166,0.12)', borderWidth: 0.5, borderColor: C.tealDim, alignItems: 'center' }}>
                <Text style={{ color: C.teal, fontSize: 13, fontWeight: '600' }}>新增</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowAdd(true)}
            style={{ padding: 11, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <PlusIcon color={C.text3} />
            <Text style={{ color: C.text3, fontSize: 13 }}>新增聯絡人</Text>
          </Pressable>
        )}

        <View style={{ backgroundColor: C.redGlow, borderWidth: 0.5, borderColor: C.redDim, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', lineHeight: 18 }}>🚑 119 緊急救援需額外確認才會撥打，不會自動通知。</Text>
        </View>
      </View>
    </SettingSubPage>
  );
}

function SubLocation({ onBack }) {
  const [locationOn, setLocationOn] = useState(true);
  const [geofence, setGeofence] = useState(true);
  const [shareWith, setShareWith] = useState(['大哥 志明', '二姊 美玲']);

  return (
    <SettingSubPage title="位置分享" onBack={onBack}>
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
            <Text style={{ fontSize: 18 }}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>即時位置分享</Text>
              <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>讓家人看到長輩位置</Text>
            </View>
            <Toggle on={locationOn} onChange={setLocationOn} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, opacity: locationOn ? 1 : 0.4 }}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>地理圍欄警示</Text>
              <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>離開設定範圍時通知</Text>
            </View>
            <Toggle on={geofence} onChange={setGeofence} />
          </View>
        </View>

        <View style={{ backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, padding: 13 }}>
          <Text style={{ fontSize: 12, color: C.text2, marginBottom: 10 }}>共享對象</Text>
          {['大哥 志明', '二姊 美玲', '小弟 建宏'].map((name) => {
            const on = shareWith.includes(name);
            return (
              <View key={name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 13, color: on ? C.text : C.text3 }}>{name}</Text>
                <Toggle on={on} onChange={() => setShareWith((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))} />
              </View>
            );
          })}
        </View>
      </View>
    </SettingSubPage>
  );
}

export default function SettingsScreen({ onSwitchMode }) {
  const [subPage, setSubPage] = useState(null);

  const rows = [
    { id: 'elder', icon: '👵', label: '長輩端資料', sub: '張秀蘭・75 歲' },
    { id: 'notifs', icon: '🔔', label: '通知設定', sub: 'SOS、藥物、每日回報' },
    { id: 'contacts', icon: '👥', label: '緊急聯絡人', sub: '3 位聯絡人' },
    { id: 'location', icon: '📍', label: '位置分享', sub: '已開啟・1 km 警示' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <Text style={{ paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '700', color: C.text }}>設定</Text>

        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Pressable onPress={onSwitchMode} style={{ padding: 13, borderRadius: 14, backgroundColor: 'rgba(20,184,166,0.1)', borderWidth: 0.5, borderColor: C.tealDim, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 20 }}>👵</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.teal }}>切換至長輩端</Text>
              <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>預覽長輩所看到的畫面</Text>
            </View>
            <ChevRightIcon color={C.teal} />
          </Pressable>
        </View>

        <View style={{ marginHorizontal: 16, backgroundColor: C.card, borderWidth: 0.5, borderColor: C.border, borderRadius: 14, overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <Pressable key={r.id} onPress={() => setSubPage(r.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderBottomWidth: i < rows.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: C.text }}>{r.label}</Text>
                <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{r.sub}</Text>
              </View>
              <ChevRightIcon color={C.text3} />
            </Pressable>
          ))}
        </View>

        <Text style={{ paddingTop: 20, paddingHorizontal: 16, fontSize: 11, color: C.text3, textAlign: 'center' }}>CareLink v0.1 — MVP 原型</Text>
      </ScrollView>

      {subPage === 'elder' && <SubElderProfile onBack={() => setSubPage(null)} />}
      {subPage === 'notifs' && <SubNotifSettings onBack={() => setSubPage(null)} />}
      {subPage === 'contacts' && <SubContacts onBack={() => setSubPage(null)} />}
      {subPage === 'location' && <SubLocation onBack={() => setSubPage(null)} />}
    </View>
  );
}

const input = {
  backgroundColor: C.card2,
  borderWidth: 0.5,
  borderColor: C.border2,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 11,
  color: C.text,
  fontSize: 14,
};
