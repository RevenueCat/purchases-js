import React, {useState} from 'react';
import {ConfigureScreen} from './screens/ConfigureScreen';
import {HomeScreen} from './screens/HomeScreen';

export const App = () => {
  const [isConfigured, setIsConfigured] = useState(false);

  return isConfigured ? (
    <HomeScreen />
  ) : (
    <ConfigureScreen onConfigured={() => setIsConfigured(true)} />
  );
};
