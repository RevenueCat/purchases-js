import React, {useState} from 'react';
import {ConfigureScreen} from './Screens/ConfigureScreen';
import {HomeScreen} from './Screens/HomeScreen';

export const App = () => {
  const [isConfigured, setIsConfigured] = useState(false);

  return isConfigured ? (
    <HomeScreen />
  ) : (
    <ConfigureScreen onConfigured={() => setIsConfigured(true)} />
  );
};
