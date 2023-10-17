import React, {Suspense} from 'react';
import {StyleSheet, View} from 'react-native';
import colors from '../colors';
import AccountsContent from './AccountsContent';

import Loading from './Loading';

export function AccountsModal({navigation}: {navigation: any}) {
  return (
    <View style={styles.bottomSheet} className="p-2">
      <Suspense fallback={<Loading full />}>
        <AccountsContent navigation={navigation} />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.neutral,
    height: '100%',
  },
});
