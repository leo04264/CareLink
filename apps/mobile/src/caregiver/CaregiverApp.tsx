import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { C } from '../theme/tokens';
import { useTweaks } from '../context/TweaksContext';
import { useAuth } from '../context/AuthContext';
import { useLiveReportStatus } from '../services/liveStatus';
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
import TweaksPanel from '../components/TweaksPanel';

export default function CaregiverApp({ onSwitchMode, onHome }) {
  const [tab, setTab] = useState('dashboard');
  const [showSOS, setShowSOS] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const { tweaks } = useTweaks();
  const { mode: authMode, caredElderId } = useAuth();
  const liveStatus = useLiveReportStatus(caredElderId, authMode === 'live');
  // Live mode: derived from /checkins/today polling. Mock mode: TweaksContext
  // override (so demo-mode users can still flip status to test UI states).
  const reportStatus = authMode === 'live' && liveStatus ? liveStatus : tweaks.reportStatus;

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
      {tab === 'notifications' && (
        <NotificationsScreen
          onCall={() => setShowCall(true)}
          onMap={() => setShowMap(true)}
          goTo={setTab}
        />
      )}
      {tab === 'health' && <HealthVitalsScreen />}
      {tab === 'appointments' && <AppointmentsScreen />}
      {tab === 'medications' && <MedicationsScreen />}
      {tab === 'settings' && <SettingsScreen onSwitchMode={onSwitchMode} />}

      <TabBar tab={tab} setTab={setTab} />

      {/* Top-right floating controls */}
      <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6, zIndex: 40 }}>
        <Pressable onLongPress={() => setShowTweaks(true)} onPress={onSwitchMode} style={{ backgroundColor: 'rgba(20,184,166,0.12)', borderWidth: 0.5, borderColor: C.tealDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 10, color: C.teal, fontWeight: '600' }}>👵 長輩端</Text>
        </Pressable>
      </View>

      {showSOS && <SOSOverlay onClose={() => setShowSOS(false)} />}
      {showCall && <PhoneCallOverlay name="媽媽・張秀蘭" number="0912-345-678" onClose={() => setShowCall(false)} />}
      {showMap && <MapLocationOverlay onClose={() => setShowMap(false)} />}
      <TweaksPanel visible={showTweaks} onClose={() => setShowTweaks(false)} />
    </View>
  );
}
