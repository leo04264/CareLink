import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

interface SpinProps {
  children?: ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Spin({ children, duration = 900, style }: SpinProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [duration, anim]);
  const spin = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={[{ transform: [{ rotate: spin }] }, style]}>{children}</Animated.View>;
}
