import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 24,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 32,
  },
  empty: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 18,
  },
  error: {
    color: '#C62828',
    fontSize: 18,
    marginTop: 32,
  },
  identifier: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 18,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  productIdentifier: {
    color: '#111111',
    fontSize: 18,
    marginTop: 12,
  },
  title: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
