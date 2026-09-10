import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  button: {
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 3,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  focusedButton: {
    borderColor: '#FF9900',
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#111111',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1479B8',
  },
  secondaryLabel: {
    color: '#1479B8',
  },
});
