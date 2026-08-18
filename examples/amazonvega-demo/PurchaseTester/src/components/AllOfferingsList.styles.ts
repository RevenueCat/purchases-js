import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
  jsonScroll: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  offering: {
    marginBottom: 32,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(60, 60, 67, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 24,
  },
  productDuration: {
    color: 'rgba(60, 60, 67, 0.7)',
    fontSize: 17,
    marginTop: 8,
  },
  productFields: {
    color: '#173B55',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    paddingBottom: 24,
  },
  productId: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '700',
  },
  productPrice: {
    color: '#0B5F91',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: '80%',
    padding: 24,
    width: '84%',
  },
  sheetBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
  },
  sheetTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
