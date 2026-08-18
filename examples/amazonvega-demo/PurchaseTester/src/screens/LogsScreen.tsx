import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {
  clearAppLogs,
  getAppLogs,
  maxAppLogEntries,
  subscribeToAppLogs,
  type AppLogEntry,
} from '../app-logs';
import {Button} from '../components/Button';
import {ScreenContainer} from '../ScreenContainer';
import {styles} from './LogsScreen.styles';

interface LogsScreenProps {
  onBack: () => void;
}

export const LogsScreen = ({onBack}: LogsScreenProps) => {
  const [logs, setLogs] = useState<readonly AppLogEntry[]>(getAppLogs());

  useEffect(() => {
    const unsubscribe = subscribeToAppLogs(() => setLogs([...getAppLogs()]));
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ScreenContainer subtitle={`App logs (${logs.length}/${maxAppLogEntries})`}>
      <View style={styles.actions}>
        <Button hasTVPreferredFocus label="Back" onPress={onBack} />
        <Button label="Clear logs" onPress={clearAppLogs} />
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.content}>
        {logs.length === 0 ? (
          <Text style={styles.empty}>No JavaScript logs captured yet.</Text>
        ) : (
          [...logs].reverse().map((log) => (
            <View key={log.id} style={styles.entry}>
              <Text style={styles.timestamp}>{log.timestamp}</Text>
              <Text style={styles.level}>{log.level}</Text>
              <Text selectable style={styles.message}>
                {log.message}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
