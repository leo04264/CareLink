import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  useFonts,
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_700Bold,
  NotoSansTC_900Black,
} from '@expo-google-fonts/noto-sans-tc';
import { Syne_500Medium, Syne_700Bold } from '@expo-google-fonts/syne';
import { C } from './src/theme/tokens';
import { TweaksProvider } from './src/context/TweaksContext';
import CaregiverApp from './src/caregiver/CaregiverApp';
import ElderApp from './src/elder/ElderApp';

function ModeSelector({ onSelect }) {
  const modes = [
    { id: 'caregiver', icon: '👨‍💻', title: '子女端', sub: '儀表板、通知、藥物管理' },
    { id: 'elder', icon: '👵', title: '長輩端', sub: '我很好、SOS、服藥提醒' },
  ];
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.brand}>CareLink</Text>
      <Text style={styles.brandSub}>選擇要預覽的介面</Text>
      {modes.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => onSelect(m.id)}
          style={({ pressed }) => [
            styles.selectorBtn,
            pressed && { borderColor: C.border2, opacity: 0.8 },
          ]}
        >
          <Text style={{ fontSize: 28 }}>{m.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text }}>{m.title}</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{m.sub}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState('selector');
  const [fontsLoaded] = useFonts({
    NotoSansTC_400Regular,
    NotoSansTC_500Medium,
    NotoSansTC_700Bold,
    NotoSansTC_900Black,
    Syne_500Medium,
    Syne_700Bold,
  });

  return (
    <TweaksProvider>
      <View style={styles.root}>
        <ExpoStatusBar style="light" />
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          {!fontsLoaded ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={C.amber} />
            </View>
          ) : (
            <>
              {mode === 'selector' && <ModeSelector onSelect={setMode} />}
              {mode === 'caregiver' && <CaregiverApp onSwitchMode={() => setMode('elder')} onHome={() => setMode('selector')} />}
              {mode === 'elder' && <ElderApp onSwitchMode={() => setMode('caregiver')} onHome={() => setMode('selector')} />}
            </>
          )}
        </SafeAreaView>
      </View>
    </TweaksProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  selectorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  brand: { fontSize: 28, fontWeight: '700', color: C.amber, letterSpacing: 1, marginBottom: 6, fontFamily: 'Syne_700Bold' },
  brandSub: { fontSize: 13, color: C.text2, marginBottom: 14 },
  selectorBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
