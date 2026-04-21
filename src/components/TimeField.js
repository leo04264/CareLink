import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TextInput } from 'react-native';
import { C } from '../theme/tokens';

// Prototype uses <input type="time">. Native gets a DateTimePicker
// sheet; web keeps a plain "HH:MM" text input.
let DateTimePicker = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (_) {}

function parseHHMM(str) {
  const [h, m] = (str || '00:00').split(':').map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
}
function fmt(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimeField({ value, onChange, label }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web' || !DateTimePicker) {
    return (
      <View>
        {label && <Text style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>{label}</Text>}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="08:00"
          placeholderTextColor={C.text3}
          style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: C.text, fontSize: 13 }}
        />
      </View>
    );
  }

  return (
    <View>
      {label && <Text style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>{label}</Text>}
      <Pressable onPress={() => setShow(true)} style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 }}>
        <Text style={{ color: C.text, fontSize: 13, fontFamily: 'Syne_500Medium' }}>{value || '--:--'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={parseHHMM(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            setShow(false);
            if (d) onChange(fmt(d));
          }}
        />
      )}
    </View>
  );
}
