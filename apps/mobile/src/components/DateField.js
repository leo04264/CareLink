import React, { useState } from 'react';
import { View, Text, Pressable, Platform, TextInput } from 'react-native';
import { C } from '../theme/tokens';

let DateTimePicker = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (_) {}

// value: "YYYY-MM-DD" or ""
export default function DateField({ value, onChange }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web' || !DateTimePicker) {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={C.text3}
        style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: C.text, fontSize: 13 }}
      />
    );
  }

  const parse = () => {
    if (!value) return new Date();
    const [y, m, d] = value.split('-').map((x) => parseInt(x, 10));
    const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
    return dt;
  };

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return (
    <View>
      <Pressable onPress={() => setShow(true)} style={{ backgroundColor: C.card2, borderWidth: 0.5, borderColor: C.border2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
        <Text style={{ color: value ? C.text : C.text3, fontSize: 13 }}>{value || 'YYYY-MM-DD'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={parse()}
          mode="date"
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
