import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, { Suspense } from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {Header} from './components/Header';

import MainScreen from './screens/MainScreen';

export default function App() {
  return (
    <Suspense fallback={<View><Text>Loading...</Text></View>}>
    <ConnectionProvider
      config={{commitment: 'processed'}}
      endpoint={clusterApiUrl(RPC_ENDPOINT)}>
      <AuthorizationProvider>
          <SafeAreaView style={styles.shell}>
            <Header />
            <MainScreen />
          </SafeAreaView>
      </AuthorizationProvider>
    </ConnectionProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: '100%',
  },
});
