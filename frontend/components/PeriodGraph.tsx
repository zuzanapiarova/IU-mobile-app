import React, { useEffect, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { globalStyles } from '../constants/globalStyles';
import { LineChart } from 'react-native-gifted-charts';
import { useUser } from '../constants/UserContext'

interface PeriodGraphProps {
    habitsByDate: any[];
    graphData: any[];
}

const getXAxisLabels = (habitsByDate: any[]) => {
    const labels = habitsByDate.map((item) => {
      const parsedDate = new Date(item.date);
      console.log(item.date);
      return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
      });
    });

    console.log('habitsByDate:', habitsByDate); //! ERROR - i am passing it in as a wrong DT and it cannot resolve 
  
    const interval = labels.length > 31 ? 30 : labels.length > 7 ? 7 : 1;
  
    return labels.map((label, index) => (index % interval === 0 ? label : ''));
};

export default function PeriodGraph({ habitsByDate, graphData }: PeriodGraphProps) {
    const theme = useTheme();
    const { user } = useUser();
    const screenWidth = Dimensions.get('window').width;
    const [xAxisLabels, setXAxisLabels] = useState<any[]>(getXAxisLabels(graphData));
 
    if (!user) {
        alert('You must be logged in!');
        return null;
    }

    return (
        <Card style={[globalStyles.card, { backgroundColor: theme.colors.background, marginTop: 16 }]}>
        <Text variant="titleMedium" style={{ marginBottom: 4 }}>Completion Percentage</Text>
        {/* Calculate and display the average completion */}
        {(() => {
            const today = new Date().toISOString().split('T')[0]; // Get today's date
            const filteredHabitsByDate = habitsByDate.filter((item) => item.date <= today); // Exclude future dates
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
            adjustToWidth
            showScrollIndicator={false}
            initialSpacing={0} // No extra spacing at the start
            endSpacing={0} // No extra spacing at the end
            yAxisOffset={0}
            width={screenWidth - 92} // Explicitly set the chart's width (subtract padding/margin if needed)
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
            fontSize: 10,
            textAlign: 'right',
            }}
            maxValue={100} // Forces chart top to be 100
            stepValue={10} // Distance between sections
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