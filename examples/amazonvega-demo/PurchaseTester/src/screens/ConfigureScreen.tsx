import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Purchases} from '@revenuecat/purchases-js';
import {API_KEY, APP_USER_ID} from '../constants';
import {ScreenContainer} from '../ScreenContainer';
import {styles} from './ConfigureScreen.styles';

interface ConfigureScreenProps {
  onConfigured: () => void;
}

export const ConfigureScreen = ({onConfigured}: ConfigureScreenProps) => {
  const [configureError, setConfigureError] = useState<string | null>(null);
  const isApiKeySet = API_KEY.trim().length > 0;
  const appUserId =
    APP_USER_ID || Purchases.generateRevenueCatAnonymousAppUserId();

  const configurePurchases = () => {
    console.log('Configuring the RevenueCat SDK...');
    try {
      Purchases.configure({
        apiKey: API_KEY,
        appUserId,
      });
      console.log('Successfully configured the RevenueCat SDK.');
      setConfigureError(null);
      onConfigured();
    } catch (error) {
      console.log(error);
      setConfigureError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <ScreenContainer subtitle="SDK configuration">
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SDK Settings</Text>

          {isApiKeySet ? (
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>RevenueCat API Key</Text>
              <Text style={styles.settingValue}>{API_KEY}</Text>
            </View>
          ) : (
            <View style={styles.errorMessage}>
              <Text style={styles.errorTitle}>API key required</Text>
              <Text style={styles.errorDescription}>
                Set API_KEY in constants.ts to configure the RevenueCat SDK.
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>App User ID</Text>
            <Text style={styles.settingValue}>
              {APP_USER_ID || 'Will create a new anonymous ID'}
            </Text>
          </View>
        </View>
        <Text style={styles.secondary}>
          Modify these values in constants.ts
        </Text>
        <Pressable
          hasTVPreferredFocus
          style={styles.configureButton}
          onPress={configurePurchases}>
          <Text style={styles.configureButtonText}>Configure</Text>
        </Pressable>
        {configureError && (
          <Text style={styles.configureError}>{configureError}</Text>
        )}
      </View>
    </ScreenContainer>
  );
};
