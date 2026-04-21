import React from 'react';
import { Pressable, View } from 'react-native';
import { C } from '../theme/tokens';

export default function Toggle({ on, onChange, color = C.teal, size = 'md' }) {
  const W = size === 'sm' ? 32 : 40;
  const H = size === 'sm' ? 18 : 22;
  const KNOB = size === 'sm' ? 14 : 18;
  const PAD = 2;
  return (
    <Pressable
      onPress={() => onChange && onChange(!on)}
      style={{
        width: W,
        height: H,
        borderRadius: H / 2,
        backgroundColor: on ? color : 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: '#fff',
          position: 'absolute',
          top: PAD,
          left: on ? W - KNOB - PAD : PAD,
        }}
      />
    </Pressable>
  );
}
