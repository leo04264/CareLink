import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C } from '../theme/tokens';
import { HomeIcon, HeartIcon, PillIcon, CalendarIcon, SettingsIcon } from '../components/Icons';

export default function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'dashboard', label: '總覽', Icon: HomeIcon },
    { id: 'health', label: '健康', Icon: HeartIcon },
    { id: 'medications', label: '藥物', Icon: PillIcon, badge: 1 },
    { id: 'appointments', label: '行程', Icon: CalendarIcon },
    { id: 'settings', label: '設定', Icon: SettingsIcon },
  ];
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        backgroundColor: 'rgba(10,13,20,0.97)',
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        flexDirection: 'row',
        paddingBottom: 12,
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        const color = active ? C.amber : C.text3;
        return (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              position: 'relative',
            }}
          >
            <t.Icon size={22} color={color} />
            <Text style={{ fontSize: 10, color, fontWeight: active ? '700' : '400' }}>{t.label}</Text>
            {t.badge && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: '32%',
                  width: 14,
                  height: 14,
                  backgroundColor: C.red,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{t.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
