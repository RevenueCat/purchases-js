import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {
  Purchases,
  type Offering,
  type Package,
  type Product,
} from '@revenuecat/purchases-js/vega';
import {styles} from './AllOfferingsList.styles';
import {Button} from './Button';
import {formatJsonData, DataModal} from './DataModal';

type ModalData = {
  formattedData: string;
  title: string;
};

const formatDuration = (product: Product): string => {
  if (product.period === null) {
    return 'One-time purchase';
  }

  const {number, unit} = product.period;
  return `Every ${number} ${unit}${number === 1 ? '' : 's'}`;
};

export const AllOfferingsList = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(
    null,
  );
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

  const purchase = async (pkg: Package) => {
    if (purchasingPackageId !== null) {
      return;
    }

    setPurchasingPackageId(pkg.identifier);
    console.log(`Purchasing ${pkg.webBillingProduct.identifier}...`);

    try {
      const result = await Purchases.getSharedInstance().purchase({
        rcPackage: pkg,
      });
      setModalData({
        formattedData: formatJsonData(result),
        title: 'Purchase result',
      });
      console.log(
        `Successfully purchased ${pkg.webBillingProduct.identifier}.`,
      );
    } catch (purchaseError) {
      console.error(
        `Failed to purchase ${pkg.webBillingProduct.identifier}:`,
        purchaseError,
      );
      setModalData({
        formattedData: String(purchaseError),
        title: 'Purchase failed',
      });
    } finally {
      setPurchasingPackageId(null);
    }
  };

  if (error) {
    return <Text style={styles.error}>Unable to load offerings: {error}</Text>;
  }

  if (isLoading) {
    return <Text style={styles.empty}>Loading offerings…</Text>;
  }

  return (
    <>
      <ScrollView style={styles.list} contentContainerStyle={styles.content}>
        {offerings.map((offering) => (
          <View key={offering.identifier} style={styles.offering}>
            <Text style={styles.title}>{offering.serverDescription}</Text>
            <Text style={styles.identifier}>ID: {offering.identifier}</Text>
            {offering.availablePackages.map((pkg) => {
              const product = pkg.webBillingProduct;
              const isPurchasing = purchasingPackageId === pkg.identifier;

              return (
                <View key={pkg.identifier} style={styles.productCard}>
                  <Text style={styles.productId}>{product.identifier}</Text>
                  <Text style={styles.productPrice}>
                    {product.price.formattedPrice}
                  </Text>
                  <Text style={styles.productDuration}>
                    {formatDuration(product)}
                  </Text>
                  <View style={styles.actions}>
                    <Button
                      label={isPurchasing ? 'Purchasing…' : 'Purchase'}
                      onPress={() => void purchase(pkg)}
                    />
                    <Button
                      label="View details"
                      onPress={() =>
                        setModalData({
                          formattedData: formatJsonData(product),
                          title: 'Product details',
                        })
                      }
                      variant="secondary"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        {offerings.length === 0 && (
          <Text style={styles.empty}>No offerings are available.</Text>
        )}
      </ScrollView>

      <DataModal
        formattedData={modalData?.formattedData ?? null}
        onClose={() => setModalData(null)}
        title={modalData?.title ?? ''}
      />
    </>
  );
};
