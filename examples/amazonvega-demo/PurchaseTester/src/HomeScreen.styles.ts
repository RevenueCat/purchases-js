import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    width: '56%',
  },
  statusTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDescription: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 18,
    marginTop: 8,
  },
});
