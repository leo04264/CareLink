import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

interface PulseProps {
  children?: ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}

// Wrapper that mimics the prototype's `pulse` keyframe (opacity 1 → .4 → 1)
export default function Pulse({ children, duration = 1500, style, enabled = true }: PulseProps) {
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
