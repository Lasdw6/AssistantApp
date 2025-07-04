// HUDRadar.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Circle, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SIZE = 300;
const CENTER = SIZE / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function HUDRadar() {
  const outerRotation = useSharedValue(0);
  const innerRotation = useSharedValue(0);
  const arcRotation = useSharedValue(0);

  useEffect(() => {
    outerRotation.value = withRepeat(withTiming(360, { duration: 4000 }), -1);
    innerRotation.value = withRepeat(withTiming(-360, { duration: 6000 }), -1);
    arcRotation.value = withRepeat(withTiming(360, { duration: 3000 }), -1);
  }, []);

  const outerAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${outerRotation.value}deg` }],
  }));

  const innerAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${innerRotation.value}deg` }],
  }));

  const arcAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${arcRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <G x={CENTER} y={CENTER}>

          {/* Outer dashed circle rotating */}
          <AnimatedCircle
            r={140}
            stroke="#00FFFF"
            strokeWidth={2}
            strokeDasharray="10,5"
            fill="none"
            animatedProps={outerAnimatedProps}
          />

          {/* Inner dashed circle rotating opposite */}
          <AnimatedCircle
            r={110}
            stroke="#00FFFF"
            strokeWidth={2}
            strokeDasharray="6,4"
            fill="none"
            animatedProps={innerAnimatedProps}
          />

          {/* Rotating arc sweep */}
          <AnimatedPath
            d="M 0 -90 A 90 90 0 0 1 50 -75"
            stroke="#00FFFF"
            strokeWidth={6}
            fill="none"
            animatedProps={arcAnimatedProps}
          />

          {/* Static tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 * Math.PI) / 180;
            const r1 = 130, r2 = 140;
            const x1 = Math.cos(angle) * r1;
            const y1 = Math.sin(angle) * r1;
            const x2 = Math.cos(angle) * r2;
            const y2 = Math.sin(angle) * r2;
            return (
              <Line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#00FFFF"
                strokeWidth={1}
              />
            );
          })}

          {/* Core pulse circle */}
          <Circle
            r={10}
            stroke="#00FFFF"
            strokeWidth={3}
            fill="#001F2F"
          />

        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
