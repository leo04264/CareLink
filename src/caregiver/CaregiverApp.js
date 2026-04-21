import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { C } from '../theme/tokens';
import DashboardScreen from './DashboardScreen';
import HealthVitalsScreen from './HealthVitalsScreen';
import MedicationsScreen from './MedicationsScreen';
import AppointmentsScreen from './AppointmentsScreen';
import SettingsScreen from './SettingsScreen';
import NotificationsScreen from './NotificationsScreen';
import TabBar from './TabBar';
import SOSOverlay from './overlays/SOSOverlay';
import PhoneCallOverlay from './overlays/PhoneCallOverlay';
import MapLocationOverlay from './overlays/MapLocationOverlay';

const STATUSES = ['ok', 'warning', 'critical'];

export default function CaregiverApp({ onSwitchMode, onHome }) {
  const [tab, setTab] = useState('dashboard');
  const [showSOS, setShowSOS] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [statusIdx, setStatusIdx] = useState(1); // default warning for demo
  const reportStatus = STATUSES[statusIdx];

  const cycleStatus = () => setStatusIdx((i) => (i + 1) % STATUSES.length);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, position: 'relative' }}>
      {tab === 'dashboard' && (
        <DashboardScreen
          onSOS={() => setShowSOS(true)}
          onCall={() => setShowCall(true)}
          onMap={() => setShowMap(true)}
          goTo={setTab}
          reportStatus={reportStatus}
        />
      )}
      {tab === 'notifications' && <NotificationsScreen />}
      {tab === 'health' && <HealthVitalsScreen />}
      {tab === 'appointments' && <AppointmentsScreen />}
      {tab === 'medications' && <MedicationsScreen />}
      {tab === 'settings' && <SettingsScreen onSwitchMode={onSwitchMode} />}

      <TabBar tab={tab} setTab={setTab} />

      {/* Floating mode controls (dev/demo helpers) */}
      <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6, zIndex: 40 }}>
        <Pressable onPress={cycleStatus} style={pillStyle(reportStatus)}>
          <Text style={{ fontSize: 10, color: statusColor(reportStatus), fontWeight: '700' }}>
            {reportStatus === 'ok' ? '● 正常' : reportStatus === 'warning' ? '● 警告' : '● 危急'}
          </Text>
        </Pressable>
        <Pressable onPress={onSwitchMode} style={{ backgroundColor: 'rgba(20,184,166,0.12)', borderWidth: 0.5, borderColor: C.tealDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 10, color: C.teal, fontWeight: '600' }}>👵 長輩端</Text>
        </Pressable>
      </View>

      {showSOS && <SOSOverlay onClose={() => setShowSOS(false)} />}
      {showCall && <PhoneCallOverlay name="媽媽・張秀蘭" number="0912-345-678" onClose={() => setShowCall(false)} />}
      {showMap && <MapLocationOverlay onClose={() => setShowMap(false)} />}
    </View>
  );
}

function statusColor(s) {
  if (s === 'ok') return C.green;
  if (s === 'warning') return C.amber;
  return C.red;
}

function pillStyle(s) {
  const c = statusColor(s);
  return {
    backgroundColor: `${c}22`,
    borderWidth: 0.5,
    borderColor: `${c}55`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  };
}
