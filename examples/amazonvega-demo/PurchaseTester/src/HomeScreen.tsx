import React from 'react';
import {Text, View} from 'react-native';
import {ScreenContainer} from './ScreenContainer';
import {styles} from './HomeScreen.styles';

export const HomeScreen = () => (
  <ScreenContainer subtitle="Home">
    <View style={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>RevenueCat SDK configured</Text>
        <Text style={styles.statusDescription}>
          The Purchase Tester app is ready to go!
        </Text>
      </View>
    </View>
  </ScreenContainer>
);
