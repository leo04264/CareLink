import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Approximates the prototype's radial-gradient background glows.
// Usage: <RadialGlow color="rgba(34,197,94,0.2)" cx="50%" cy="50%" r="50%" size={280} />
// Absolute-positioned by parent; pointerEvents none so it doesn't steal taps.
export default function RadialGlow({
  color = 'rgba(20,184,166,0.2)',
  size = 280,
  cx = '50%',
  cy = '50%',
  rx = '50%',
  style,
}) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="g" cx={cx} cy={cy} rx={rx} ry={rx} fx={cx} fy={cy}>
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="70%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />
      </Svg>
    </View>
  );
}
