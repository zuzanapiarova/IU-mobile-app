import React from "react";
import { View } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { globalStyles } from "../constants/globalStyles";

interface OverviewCardProps {
  habitNames: string[];
  title: string;
  unit: string;
  value: number;
  color: string;
}

// card to display habit statistics in the overview component
export default function OverviewCard({ habitNames, title, unit, value, color}: OverviewCardProps)
{
  const theme = useTheme();

  // if the successful statistics would be 0,donot render them
  if (title === "Longest Streak" && value <= 1) return;
  if (title === "Most Completed" && value === 0) return;
  

  return (
    <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[globalStyles.circle, { backgroundColor: color }]}>
          <Text style={{ color: theme.colors.background, fontWeight: "bold", fontSize: 24 }}>
            {value}
          </Text>
          <Text style={{ textAlign: "center", color: theme.colors.background, fontSize: 10 }}>
            {unit}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>{title}</Text>
          {habitNames.map((name, index) => (
            <Text key={index} style={{ fontSize: 14, color: "gray", flexWrap: "wrap", flex: 1 }}>
              {name}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
}
