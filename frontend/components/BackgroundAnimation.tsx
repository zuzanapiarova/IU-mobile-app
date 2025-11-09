import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function MovingBackground() {
  const theme = useTheme();

  // Number of circles
  const numCircles = 5;

  // Define specific positions for the circles
  const circlePositions = [
    { cx: width * 0.8, cy: height * 0.1 }, // Top-left corner
    { cx: width * 0.3, cy: height * 0.2 }, // Slightly below and to the right
    { cx: width * 0.6, cy: height * 0.45 }, // Below and to the left
    { cx: width * 0.2, cy: height * 0.7 }, // Somewhere on the right
    { cx: width * 0.8, cy: height * 0.9 }, // Bottom-center area
  ];

  // Generate shared values for radii and positions
  const circles = Array.from({ length: numCircles }, (_, index) => ({
    radius: useSharedValue(10 + (index % 2 + 1) * 20), // Start with different radii
    cx: circlePositions[index].cx, // Explicit x position
    cy: circlePositions[index].cy, // Explicit y position
    duration: (index % 2 + 1) * 50, // Different animation durations
  }));

  // Animate the radii to grow and shrink continuously
  useEffect(() => {
    circles.forEach((circle) => {
      circle.radius.value = withRepeat(
        withTiming(circle.radius.value, {
          duration: circle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    });
  }, []);

  // Create animated props for each circle
  const animatedProps = circles.map((circle) =>
    useAnimatedProps(() => ({
      r: circle.radius.value + 40,
    }))
  );

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      {/* Animated Background */}
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        {circles.map((circle, index) => (
          <AnimatedCircle
            key={index}
            cx={circle.cx} // Explicit x position
            cy={circle.cy} // Explicit y position
            fill='#93c47d' // Semi-transparent green
            animatedProps={animatedProps[index]} // Bind animated props
          />
        ))}
      </Svg>

      {/* Glass Effect */}
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
    </View>
  );
}