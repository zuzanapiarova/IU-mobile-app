import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnection } from '@/constants/ConnectionContext';
import { globalStyles } from '@/constants/globalStyles';

// show banner only when some component sets the message
const GlobalBanner: React.FC = () => {
  const { bannerMessage, setBannerMessage } = useConnection();
  if (!bannerMessage) return null;

  return (
    <View style={globalStyles.banner}>
      <Text style={{color: 'white', textAlign: 'center'}}>{bannerMessage}</Text>
      <Text
        style={{color: 'white', textAlign: 'center', textDecorationLine: 'underline', marginTop: 5}}
        onPress={() => setBannerMessage(null)}
      >
        Dismiss
      </Text>
    </View>
  );
};

export default GlobalBanner;