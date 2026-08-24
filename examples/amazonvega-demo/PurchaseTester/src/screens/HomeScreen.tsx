import React, {useState} from 'react';
import {View} from 'react-native';
import {Purchases} from '@revenuecat/purchases-js/vega';
import {AllOfferingsList} from '../components/AllOfferingsList';
import {Button} from '../components/Button';
import {ScreenContainer} from '../ScreenContainer';
import {LogsScreen} from './LogsScreen';
import {styles} from './LogsScreen.styles';

export const HomeScreen = () => {
  const [isShowingLogs, setIsShowingLogs] = useState(false);

  const syncPurchases = async () => {
    console.log('Syncing purchases...');
    try {
      await Purchases.getSharedInstance().syncPurchases();
      console.log('Successfully synced purchases.');
    } catch (error) {
      console.error('Failed to sync purchases:', error);
    }
  };

  const restorePurchases = async () => {
    console.log('Restoring purchases...');
    try {
      await Purchases.getSharedInstance().restorePurchases();
      console.log('Successfully restored purchases.');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
    }
  };

  if (isShowingLogs) {
    return <LogsScreen onBack={() => setIsShowingLogs(false)} />;
  }

  return (
    <ScreenContainer subtitle="Home">
      <View style={styles.actions}>
        <Button label="Sync purchases" onPress={() => void syncPurchases()} />
        <Button
          label="Restore purchases"
          onPress={() => void restorePurchases()}
        />
        <Button
          hasTVPreferredFocus
          label="View app logs"
          onPress={() => setIsShowingLogs(true)}
        />
      </View>
      <AllOfferingsList />
    </ScreenContainer>
  );
};
