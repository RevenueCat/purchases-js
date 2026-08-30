import React, {useState} from 'react';
import {View} from 'react-native';
import {Purchases} from '@revenuecat/purchases-js/vega';
import {AllOfferingsList} from '../components/AllOfferingsList';
import {Button} from '../components/Button';
import {formatJsonData, DataModal} from '../components/DataModal';
import {ScreenContainer} from '../ScreenContainer';
import {LogsScreen} from './LogsScreen';
import {styles} from './LogsScreen.styles';

type ModalData = {
  formattedData: string;
  title: string;
};

export const HomeScreen = () => {
  const [isShowingLogs, setIsShowingLogs] = useState(false);
  const [isFetchingCustomerInfo, setIsFetchingCustomerInfo] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const syncPurchases = async () => {
    console.log('Syncing purchases...');
    try {
      const result = await Purchases.getSharedInstance().syncPurchases();
      setModalData({
        formattedData: formatJsonData(result),
        title: 'Sync purchases result',
      });
      console.log('Successfully synced purchases.');
    } catch (error) {
      console.error('Failed to sync purchases:', error);
      setModalData({
        formattedData: String(error),
        title: 'Sync purchases failed',
      });
    }
  };

  const restorePurchases = async () => {
    console.log('Restoring purchases...');
    try {
      const result = await Purchases.getSharedInstance().restorePurchases();
      setModalData({
        formattedData: formatJsonData(result),
        title: 'Restore purchases result',
      });
      console.log('Successfully restored purchases.');
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      setModalData({
        formattedData: String(error),
        title: 'Restore purchases failed',
      });
    }
  };

  const fetchCustomerInfo = async () => {
    if (isFetchingCustomerInfo) {
      return;
    }

    setIsFetchingCustomerInfo(true);
    console.log('Fetching customer info...');
    try {
      const customerInfo =
        await Purchases.getSharedInstance().getCustomerInfo();
      setModalData({
        formattedData: formatJsonData(customerInfo),
        title: 'Customer info',
      });
      console.log('Successfully fetched customer info.');
    } catch (error) {
      console.error('Failed to fetch customer info:', error);
      setModalData({
        formattedData: String(error),
        title: 'Customer info failed',
      });
    } finally {
      setIsFetchingCustomerInfo(false);
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
          label={
            isFetchingCustomerInfo ? 'Fetching customer info…' : 'Customer info'
          }
          onPress={() => void fetchCustomerInfo()}
        />
        <Button
          hasTVPreferredFocus
          label="View app logs"
          onPress={() => setIsShowingLogs(true)}
        />
      </View>
      <AllOfferingsList />
      <DataModal
        formattedData={modalData?.formattedData ?? null}
        onClose={() => setModalData(null)}
        title={modalData?.title ?? ''}
      />
    </ScreenContainer>
  );
};
