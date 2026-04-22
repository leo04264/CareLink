import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Wrapper that mimics the prototype's `pulse` keyframe (opacity 1 → .4 → 1)
export default function Pulse({ children, duration = 1500, style, enabled = true }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: duration / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, enabled, anim]);
  return <Animated.View style={[{ opacity: anim }, style]}>{children}</Animated.View>;
}
