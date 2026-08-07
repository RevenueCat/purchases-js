import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {Purchases, type Offering, type Product} from '@revenuecat/purchases-js';
import {styles} from './AllOfferingsList.styles';

const formatProduct = (product: Product): string =>
  JSON.stringify(
    product,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );

export const AllOfferingsList = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [expandedOfferingIds, setExpandedOfferingIds] = useState<Set<string>>(
    new Set(),
  );
  const [focusedOfferingId, setFocusedOfferingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        const purchases = Purchases.getSharedInstance();
        console.log('Fetching customer info');
        const ci = await purchases.getCustomerInfo();
        console.log(ci);
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

  const toggleOffering = (offeringId: string) => {
    setExpandedOfferingIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(offeringId)) {
        nextIds.delete(offeringId);
      } else {
        nextIds.add(offeringId);
      }

      return nextIds;
    });
  };

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.content}>
      {offerings.map((offering) => {
        const isExpanded = expandedOfferingIds.has(offering.identifier);
        const isFocused = focusedOfferingId === offering.identifier;
        const productCount = offering.availablePackages.length;

        return (
          <Pressable
            key={offering.identifier}
            accessibilityRole="button"
            accessibilityState={{expanded: isExpanded}}
            onBlur={() => setFocusedOfferingId(null)}
            onFocus={() => setFocusedOfferingId(offering.identifier)}
            onPress={() => toggleOffering(offering.identifier)}
            style={[
              styles.card,
              isExpanded && styles.expandedCard,
              isFocused && styles.focusedCard,
            ]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleGroup}>
                <Text style={styles.title}>{offering.serverDescription}</Text>
                <Text style={styles.identifier}>ID: {offering.identifier}</Text>
              </View>
              <Text style={styles.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
            </View>
            <Text style={styles.productCount}>
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </Text>
            {isExpanded && (
              <View style={styles.productDetails}>
                {offering.availablePackages.map((pkg) => (
                  <View key={pkg.identifier} style={styles.productSection}>
                    <Text style={styles.productHeading}>
                      {pkg.webBillingProduct.identifier}
                    </Text>
                    <Text style={styles.packageIdentifier}>
                      Package: {pkg.identifier}
                    </Text>
                    <Text style={styles.productFields}>
                      {formatProduct(pkg.webBillingProduct)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}
      {offerings.length === 0 && (
        <Text style={styles.empty}>No offerings are available.</Text>
      )}
    </ScrollView>
  );
};
