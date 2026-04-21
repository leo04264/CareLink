import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { C } from '../theme/tokens';
import ElderHome from './ElderHome';
import ElderSOS from './ElderSOS';
import ElderMedication from './ElderMedication';
import ElderHealthInput from './ElderHealthInput';
import ElderAppointmentView from './ElderAppointmentView';

export default function ElderApp({ onSwitchMode }) {
  const [screen, setScreen] = useState('home');
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {screen === 'home' && (
        <ElderHome
          onSOS={() => setScreen('sos')}
          onMed={() => setScreen('med')}
          onConfirm={() => {}}
          onHealth={() => setScreen('health')}
          onAppt={() => setScreen('appt')}
        />
      )}
      {screen === 'sos' && <ElderSOS onBack={() => setScreen('home')} />}
      {screen === 'med' && <ElderMedication onBack={() => setScreen('home')} />}
      {screen === 'health' && <ElderHealthInput onBack={() => setScreen('home')} />}
      {screen === 'appt' && <ElderAppointmentView onBack={() => setScreen('home')} />}

      {screen === 'home' && (
        <Pressable onPress={onSwitchMode} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(20,184,166,0.12)', borderWidth: 0.5, borderColor: C.tealDim, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, zIndex: 60 }}>
          <Text style={{ fontSize: 11, color: C.teal }}>👨‍💻 子女端</Text>
        </Pressable>
      )}
    </View>
  );
}
