import React from 'react';
import type {ReactNode} from 'react';
import {Text, View} from 'react-native';
import {styles} from './ScreenContainer.styles';

interface ScreenContainerProps {
  children: ReactNode;
  subtitle: string;
}

export const ScreenContainer = ({children, subtitle}: ScreenContainerProps) => (
  <View style={styles.container}>
    <View>
      <Text style={styles.title}>Purchase Tester</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    {children}
  </View>
);
