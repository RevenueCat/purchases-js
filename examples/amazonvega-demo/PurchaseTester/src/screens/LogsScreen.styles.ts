import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  button: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 32,
    paddingTop: 24,
  },
  empty: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 18,
  },
  entry: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  level: {
    color: '#6E3CBC',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  message: {
    color: '#111111',
    fontFamily: 'monospace',
    fontSize: 15,
    marginTop: 8,
  },
  timestamp: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 14,
  },
});
