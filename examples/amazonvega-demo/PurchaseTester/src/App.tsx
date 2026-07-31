import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Purchases} from '@revenuecat/purchases-js';
import {styles} from './App.styles';
import {API_KEY, APP_USER_ID} from './constants';
import {HomeScreen} from './HomeScreen';
import {ScreenContainer} from './ScreenContainer';

export const App = () => {
  const [configureError, setConfigureError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const isApiKeySet = API_KEY.trim().length > 0;
  const appUserId =
    APP_USER_ID || Purchases.generateRevenueCatAnonymousAppUserId();

  const configurePurchases = () => {
    console.log('Configuring RC SDK...');
    try {
      Purchases.configure({
        apiKey: API_KEY,
        appUserId,
      });
      setConfigureError(null);
      setIsConfigured(true);
    } catch (error) {
      setConfigureError(error instanceof Error ? error.message : String(error));
    }
  };

  if (isConfigured) {
    return <HomeScreen />;
  }

  return (
    <ScreenContainer subtitle="RevenueCat configuration">
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
