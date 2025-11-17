import React from 'react';
import { View } from 'react-native'
import { ActivityIndicator, useTheme } from 'react-native-paper'
import { globalStyles } from '@/constants/globalStyles';

export default function Loading()
{
    const theme = useTheme();
    
    return (
        <View style={globalStyles.center}>
            <ActivityIndicator animating size="large" color={theme.colors.primary} />
        </View>
    );
}