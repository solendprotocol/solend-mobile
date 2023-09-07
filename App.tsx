
import { useAtom } from 'jotai';
import { connectionAtom, selectedRpcAtom } from './components/atoms/settings';
import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, { Suspense, useEffect } from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import SplashScreen from 'react-native-splash-screen';
import {Header} from './components/Header';

import MainScreen from './screens/MainScreen';

export default function App() {
  const [rpc] = useAtom(selectedRpcAtom);
  useEffect(() => {
    SplashScreen.hide()
  }, []);

  return (
    <Suspense fallback={<View><Text>Loading...</Text></View>}>
    <ConnectionProvider
      config={{commitment: 'processed'}}
      endpoint={rpc.endpoint}>
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
