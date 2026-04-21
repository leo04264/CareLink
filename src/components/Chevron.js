import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Smoothly rotates ▾ 180° when `open` flips.
export default function Chevron({ open, size = 14, color = 'rgba(255,255,255,0.3)' }) {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: open ? 1 : 0, duration: 200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, [open, anim]);
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Animated.Text style={{ color, fontSize: size, transform: [{ rotate }] }}>▾</Animated.Text>
  );
}
