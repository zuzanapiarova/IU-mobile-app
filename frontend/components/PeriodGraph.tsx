import React from "react";
import { Dimensions } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { globalStyles } from "../constants/globalStyles";
import { LineChart } from "react-native-gifted-charts";
import { useUser } from "../constants/UserContext";

interface PeriodGraphProps {
  habitsByDate: any[];
  graphData: any[];
  userSignupDate: string;
}

// render habits in a period in a line graph
export default function PeriodGraph({ habitsByDate, graphData, userSignupDate }: PeriodGraphProps)
{
  const theme = useTheme();
  const { user } = useUser();
  const screenWidth = Dimensions.get("window").width;

  if (!user) return null;

  return (
    <Card style={[ globalStyles.card, { backgroundColor: theme.colors.background, marginTop: 16 }]}>
      <Text variant="titleMedium" style={{ marginBottom: 4 }}>
        Completion Percentage
      </Text>
      
      {/* Calculate and display the average completionfor the period */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        const filteredHabitsByDate = habitsByDate.filter(
          (item) => item.date <= today && item.date >= userSignupDate,
        ); // Exclude future dates
        const totalCompletion = filteredHabitsByDate.reduce(
          (sum, item) => sum + item.completionPercentage,
          0,
        );

        /* Calculate completion, avoid division by 0 */
        const averageCompletion =
          filteredHabitsByDate.length > 0
            ? Math.round(totalCompletion / filteredHabitsByDate.length)
            : 0;

        // Determine the color based on user.failureLimit and user.successLimit
        let averageCompletionColor = globalStyles.green.color;
        if (averageCompletion < user.successLimit)
          averageCompletionColor = globalStyles.yellow.color;
        if (averageCompletion < user.failureLimit)
          averageCompletionColor = globalStyles.red.color;

        return (
          <Text style={{ marginBottom: 8, color: averageCompletionColor }}>
            Average Completion: {averageCompletion}%
          </Text>
        );
      })()}

      <LineChart
        data={graphData}
        color={"grey"}
        thickness={1}
        initialSpacing={8}
        endSpacing={8}
        adjustToWidth
        showScrollIndicator={false}
        yAxisOffset={0}
        width={screenWidth - 84}
        yAxisLabelTexts={[ "0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]}
        yAxisLabelWidth={20}
        yAxisTextStyle={{
          color: theme.colors.onSurface,
          fontSize: 10,
          marginRight: 3,
        }}
        xAxisLabelTextStyle={{
          color: theme.colors.onSurface,
          fontSize: 8,
        }}
        maxValue={100}
        stepValue={10}
        noOfSections={10}
        hideDataPoints={false}
        xAxisThickness={1}
        yAxisThickness={1}
        xAxisColor={theme.colors.outline}
        yAxisColor={theme.colors.outline}
        backgroundColor={theme.colors.background}
        rulesColor={theme.colors.outline}
      />
    </Card>
  );
}
