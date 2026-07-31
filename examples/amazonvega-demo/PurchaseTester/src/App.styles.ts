import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    width: '56%',
  },
  cardTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  secondary: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 17,
    marginTop: 20,
  },
  setting: {
    gap: 8,
  },
  settingLabel: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 17,
    fontWeight: '600',
  },
  settingValue: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '500',
  },
  divider: {
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    height: 1,
    marginVertical: 24,
  },
  errorMessage: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FFB4AB',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  errorTitle: {
    color: '#B42318',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorDescription: {
    color: '#7A271A',
    fontSize: 17,
    lineHeight: 24,
    marginTop: 6,
  },
  configureButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  configureButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  configureError: {
    color: '#B42318',
    fontSize: 17,
    lineHeight: 24,
    marginTop: 12,
    textAlign: 'center',
  },
});
