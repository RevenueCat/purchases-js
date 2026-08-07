import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {AllOfferingsList} from '../components/AllOfferingsList';
import {ScreenContainer} from '../ScreenContainer';
import {LogsScreen} from './LogsScreen';
import {styles} from './LogsScreen.styles';

export const HomeScreen = () => {
  const [isShowingLogs, setIsShowingLogs] = useState(false);

  if (isShowingLogs) {
    return <LogsScreen onBack={() => setIsShowingLogs(false)} />;
  }

  return (
    <ScreenContainer subtitle="Home">
      <View style={styles.actions}>
        <Pressable
          hasTVPreferredFocus
          style={styles.button}
          onPress={() => setIsShowingLogs(true)}>
          <Text style={styles.buttonText}>View app logs</Text>
        </Pressable>
      </View>
      <AllOfferingsList />
    </ScreenContainer>
  );
};
