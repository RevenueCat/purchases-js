import React from 'react';
import {Modal, ScrollView, Text, View} from 'react-native';
import {styles} from './AllOfferingsList.styles';
import {Button} from './Button';

export const formatJsonData = (data: unknown): string =>
  JSON.stringify(
    data,
    (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    },
    2,
  );

type DataModalProps = {
  title: string;
  formattedData: string | null;
  onClose: () => void;
};

export const DataModal = ({title, formattedData, onClose}: DataModalProps) => (
  <Modal
    animationType="slide"
    onRequestClose={onClose}
    transparent
    visible={formattedData !== null}>
    <View style={styles.sheetBackdrop}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Button
            hasTVPreferredFocus
            label="Close"
            onPress={onClose}
            variant="secondary"
          />
        </View>
        <ScrollView style={styles.jsonScroll}>
          <Text style={styles.productFields}>{formattedData ?? ''}</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);
