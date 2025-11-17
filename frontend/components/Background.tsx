import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { BlurView } from "expo-blur";
import { useTheme } from "react-native-paper";

const { width, height } = Dimensions.get("window");

// background for the login page
export default function Background() {
  const theme = useTheme();

  // circles parameters
  const circles = [
    { cx: width * 0.8, cy: height * 0.1, r: 80, opacity: 1 },
    { cx: width * 0.3, cy: height * 0.2, r: 110, opacity: 1 },
    { cx: width * 0.6, cy: height * 0.45, r: 90, opacity: 1 },
    { cx: width * 0.2, cy: height * 0.7, r: 140, opacity: 1 },
    { cx: width * 0.8, cy: height * 0.9, r: 110, opacity: 1 },
  ];

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        {circles.map((circle, index) => (
          <Circle
            key={index}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="#93c47d"
            opacity={circle.opacity}
          />
        ))}
      </Svg>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />
    </View>
  );
}
