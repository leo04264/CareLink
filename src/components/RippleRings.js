import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

// Reproduces the prototype's rippleRing keyframe:
//   scale 0.8 → 1.5, opacity 0.6 → 0, 2.4s, staggered by index.
export default function RippleRings({
  color = 'rgba(34,197,94,0.35)',
  count = 3,
  size = 160,
  step = 60,
  duration = 2400,
  style,
}) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <Ring key={i} delay={(i * duration) / count} duration={duration} color={color} size={size + i * step} />
      ))}
    </View>
  );
}

function Ring({ delay, duration, color, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay, duration]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}
