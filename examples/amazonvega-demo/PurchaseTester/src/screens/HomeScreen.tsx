import React from 'react';
import {AllOfferingsList} from '../components/AllOfferingsList';
import {ScreenContainer} from '../ScreenContainer';

export const HomeScreen = () => (
  <ScreenContainer subtitle="Home">
    <AllOfferingsList />
  </ScreenContainer>
);
