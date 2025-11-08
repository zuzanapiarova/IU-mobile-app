import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { View } from 'react-native';

export default function TestAnim() {
  const offset = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(offset.value * 100) }],
  }));

  return (
    <Animated.View
      onTouchStart={() => (offset.value = Math.random())}
      style={[{ width: 100, height: 100, backgroundColor: 'green' }, animatedStyle]}
    />
  );
}