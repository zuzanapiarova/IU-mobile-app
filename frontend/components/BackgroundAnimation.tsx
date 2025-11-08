import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

function getRandomPath() {
  // Simple irregular blob shape using SVG Path
  return `M${Math.random() * width},${Math.random() * height}
    C${Math.random() * width},${Math.random() * height}
    ${Math.random() * width},${Math.random() * height}
    ${Math.random() * width},${Math.random() * height}
    Z`;
}

export default function MotivationalBackground() {
  const blob1 = useSharedValue(getRandomPath());
  const blob2 = useSharedValue(getRandomPath());
  const blob3 = useSharedValue(getRandomPath());

  useEffect(() => {
    [blob1, blob2, blob3].forEach((blob) => {
      blob.value = withRepeat(
        withTiming(getRandomPath(), {
          duration: 15000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    });
  }, []);

  const animatedProps1 = useAnimatedProps(() => ({
    d: blob1.value,
  }));
  const animatedProps2 = useAnimatedProps(() => ({
    d: blob2.value,
  }));
  const animatedProps3 = useAnimatedProps(() => ({
    d: blob3.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Glass blur layer */}
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />

      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A0F9A0" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#00C853" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>
        <AnimatedPath animatedProps={animatedProps1} fill="url(#grad1)" />
        <AnimatedPath animatedProps={animatedProps2} fill="url(#grad1)" />
        <AnimatedPath animatedProps={animatedProps3} fill="url(#grad1)" />
      </Svg>
    </View>
  );
}
