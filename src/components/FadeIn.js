import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Mirrors the CSS .anim-fadeIn: opacity 0->1, translateY 6->0, 300ms.
export default function FadeIn({ children, duration = 300, offset = 6, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [anim, duration]);
  const opacity = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });
  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}
