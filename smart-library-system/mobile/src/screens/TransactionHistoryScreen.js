import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';

const transactions = [
  { id: '1', title: 'Checked out "Campus Research Guide"', date: 'Apr 1', status: 'Completed' },
  { id: '2', title: 'Paid printing fee', date: 'Mar 30', status: 'Completed' },
  { id: '3', title: 'Returned "Digital Collections"', date: 'Mar 28', status: 'Completed' },
];

const TransactionHistoryScreen = () => {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>Transaction History</Text>
      <FlatList
        data={transactions}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemDate}>{item.date}</Text>
              <Text style={styles.itemStatus}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDate: {
    color: COLORS.onSurfaceVariant,
  },
  itemStatus: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default TransactionHistoryScreen;
