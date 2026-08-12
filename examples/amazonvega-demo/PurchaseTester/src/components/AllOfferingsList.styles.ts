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
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flex: 1,
    paddingRight: 16,
  },
  chevron: {
    color: '#1479B8',
    fontSize: 32,
    lineHeight: 32,
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
  expandedCard: {
    borderColor: '#9CCFEB',
  },
  focusedCard: {
    borderColor: '#0077B6',
    borderWidth: 3,
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
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: 16,
    marginTop: 4,
  },
  packageIdentifier: {
    color: 'rgba(32, 84, 122, 0.8)',
    fontSize: 15,
    marginTop: 4,
  },
  productCount: {
    color: '#1479B8',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
  },
  productDetails: {
    backgroundColor: '#EAF6FF',
    borderColor: '#B8DEF5',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  productFields: {
    color: '#173B55',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  productHeading: {
    color: '#0B5F91',
    fontSize: 18,
    fontWeight: 'bold',
  },
  purchaseButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0077B6',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#8AAFC4',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseError: {
    color: '#C62828',
    fontSize: 16,
    marginTop: 16,
  },
  productSection: {
    borderBottomColor: 'rgba(20, 121, 184, 0.2)',
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingTop: 16,
  },
  title: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
