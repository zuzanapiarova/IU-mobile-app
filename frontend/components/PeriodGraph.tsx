import React, { useEffect, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { globalStyles } from '../constants/globalStyles';
import { LineChart } from 'react-native-gifted-charts';
import { useUser } from '../constants/UserContext'

interface PeriodGraphProps {
    habitsByDate: any[];
    graphData: any[];
    userSignupDate: string;
}

const getXAxisLabels = (habitsByDate: any[]) => {
    const labels = habitsByDate.map((item) => {
      const parsedDate = new Date(item.date);
      const day = parsedDate.toLocaleDateString('en-GB', { day: '2-digit' });
      const month = parsedDate.toLocaleDateString('en-GB', { month: '2-digit' });
      return { day, month };
    });
  
    const length = labels.length;
  
    // Determine the interval for rendering labels
    const interval = length > 31 ? length - 15 : length > 8 ? 2 : 1;
  
    // Generate labels based on the interval
    return labels.map((label, index) => {
      if (length > 31) {
        return ''; // Render the month for every (length - 30)th label
      } else if (length > 7) {
        return index % interval === 0 ? label.day : ''; // Render the day for every 7th label
      } else {
        return (`${label.day}/${label.month}`); // Render all labels as the day
      }
    });
  };

export default function PeriodGraph({ habitsByDate, graphData, userSignupDate }: PeriodGraphProps) {
    const theme = useTheme();
    const { user } = useUser();
    const screenWidth = Dimensions.get('window').width;
    const [xAxisLabels, setXAxisLabels] = useState<any[]>(getXAxisLabels(habitsByDate));
 
    if (!user) return null;

    return (
        <Card style={[globalStyles.card, { backgroundColor: theme.colors.background, marginTop: 16 }]}>
        <Text variant="titleMedium" style={{ marginBottom: 4 }}>Completion Percentage</Text>
        {/* Calculate and display the average completion */}
        {(() => {
            const today = new Date().toISOString().split('T')[0]; // Get today's date
            const filteredHabitsByDate = habitsByDate.filter((item) => ((item.date <= today) && (item.date >= userSignupDate))); // Exclude future dates
            const totalCompletion = filteredHabitsByDate.reduce((sum, item) => sum + item.completionPercentage, 0);
            const averageCompletion = filteredHabitsByDate.length > 0
            ? Math.round(totalCompletion / filteredHabitsByDate.length)
            : 0; // Avoid division by zero

            // Determine the color based on user.failureLimit and user.successLimit
            let averageCompletionColor = globalStyles.green.color; // Default to green
            if (averageCompletion < user.successLimit) averageCompletionColor = globalStyles.yellow.color;
            if (averageCompletion < user.failureLimit) averageCompletionColor = globalStyles.red.color;

            return (
            <Text style={{marginBottom: 8, color: averageCompletionColor}}>
                Average Completion: {averageCompletion}%
            </Text>
            );
        })()}
        <LineChart
            data={graphData}
            color={'grey'} // Gradient colors for the line
            thickness={1}
            initialSpacing={8}
            endSpacing={8}
            adjustToWidth
            showScrollIndicator={false}
            yAxisOffset={0}
            width={screenWidth - 84} // Explicitly set the chart's width (subtract padding/margin if needed)
            yAxisLabelTexts={["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]} // Fixed y-axis labels
            yAxisLabelWidth={20}
            yAxisTextStyle={{
                color: theme.colors.onSurface,
                fontSize: 10,
                marginRight: 3,
            }}
            xAxisLabelTexts={xAxisLabels}      
            xAxisLabelTextStyle={{
                color: theme.colors.onSurface,
                fontSize: 8
            }}
            maxValue={100} // Forces chart top to be 100
            stepValue={10} // y step value
            noOfSections={10} // Determines number of lines (0-100)
            hideDataPoints={false}
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={theme.colors.outline}
            yAxisColor={theme.colors.outline}
            backgroundColor={theme.colors.background}
            rulesColor={theme.colors.outline}
        />
        </Card>
    )
};