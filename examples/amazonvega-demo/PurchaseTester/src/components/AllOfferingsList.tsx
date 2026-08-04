import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {Purchases, type Offering} from '@revenuecat/purchases-js';
import {styles} from './AllOfferingsList.styles';

export const AllOfferingsList = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        const purchases = Purchases.getSharedInstance();
        const fetchedOfferings = await purchases.getOfferings();
        setOfferings(Object.values(fetchedOfferings.all));
        setError(null);
      } catch (loadError) {
        console.log(loadError);
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOfferings();
  }, []);

  if (error) {
    return <Text style={styles.error}>Unable to load offerings: {error}</Text>;
  }

  if (isLoading) {
    return <Text style={styles.empty}>Loading offerings…</Text>;
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.content}>
      {offerings.map((offering) => (
        <View key={offering.identifier} style={styles.card}>
          <Text style={styles.title}>{offering.serverDescription}</Text>
          <Text style={styles.identifier}>ID: {offering.identifier}</Text>
          {offering.availablePackages.map((pkg) => (
            <Text key={pkg.identifier} style={styles.productIdentifier}>
              Product ID: {pkg.webBillingProduct.identifier}
            </Text>
          ))}
        </View>
      ))}
      {offerings.length === 0 && (
        <Text style={styles.empty}>No offerings are available.</Text>
      )}
    </ScrollView>
  );
};
