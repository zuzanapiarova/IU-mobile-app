import React from 'react';
import { View } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { globalStyles } from '../constants/globalStyles';

interface OverviewCardProps {
  habitName: string;
  title: string;
  unit: string;
  value: number;
}

export default function OverviewCard({ habitName, title, unit, value }: OverviewCardProps) {
  const theme = useTheme();

  return (
    <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[globalStyles.circle, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.background, fontWeight: 'bold', fontSize: 24 }}>
            {value}
          </Text>
          <Text style={{ textAlign: 'center', color: theme.colors.background, fontSize: 10 }}>
            {unit}
          </Text>
        </View>
        <View style={{ marginLeft: 4 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: 'gray' }}>{habitName}</Text>
        </View>
      </View>
    </Card>
  );
}