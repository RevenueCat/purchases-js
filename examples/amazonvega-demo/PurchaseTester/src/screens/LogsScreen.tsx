import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {
  clearAppLogs,
  getAppLogs,
  maxAppLogEntries,
  subscribeToAppLogs,
  type AppLogEntry,
} from '../app-logs';
import {ScreenContainer} from '../ScreenContainer';
import {styles} from './LogsScreen.styles';

interface LogsScreenProps {
  onBack: () => void;
}

export const LogsScreen = ({onBack}: LogsScreenProps) => {
  const [logs, setLogs] = useState<readonly AppLogEntry[]>(getAppLogs());

  useEffect(() => subscribeToAppLogs(() => setLogs([...getAppLogs()])), []);

  return (
    <ScreenContainer subtitle={`App logs (${logs.length}/${maxAppLogEntries})`}>
      <View style={styles.actions}>
        <Pressable hasTVPreferredFocus style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={clearAppLogs}>
          <Text style={styles.buttonText}>Clear logs</Text>
        </Pressable>
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
