
import { useAtom } from 'jotai';
import { connectionAtom, selectedRpcAtom } from './components/atoms/settings';
import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React, { Suspense, useEffect } from 'react';
import {Button, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {Header} from './components/Header';

import MainScreen from './screens/MainScreen';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { AccountsModal } from './components/AccountsModal';
import { PoolsModal } from './components/PoolsModal';
import Loading from './components/Loading';

function HomeScreen({ navigation, rightNavigation }: {navigation: any, rightNavigation: any}) {
  return (
    <>
      <Header leftNavigation={navigation} rightNavigation={rightNavigation}/>
      <MainScreen/>
    </>
  );
}

const LeftDrawer = createDrawerNavigator();

const LeftDrawerScreen = ({ navigation }: {navigation: any}) => {
  return (
    <LeftDrawer.Navigator screenOptions={{ drawerPosition: 'left' , headerShown: false, swipeEdgeWidth: 100 }}
    drawerContent={PoolsModal}>
      <LeftDrawer.Screen name="Home">
          {props => <HomeScreen {...props} rightNavigation={navigation} />}
        </LeftDrawer.Screen>
    </LeftDrawer.Navigator>
  );
};

const RightDrawer = createDrawerNavigator();

const RightDrawerScreen = () => {
  return (
    <RightDrawer.Navigator
      screenOptions={{ drawerPosition: 'right', headerShown: false, swipeEdgeWidth: 100}}
      backBehavior='none'
drawerContent={AccountsModal}
    >
      <RightDrawer.Screen name="HomeDrawer" component={LeftDrawerScreen} />
    </RightDrawer.Navigator>
  );
};

export default function App() {
  const [rpc] = useAtom(selectedRpcAtom);

  return (
    <Suspense fallback={<Loading full/>}>
    <ConnectionProvider
      config={{commitment: 'processed'}}
      endpoint={rpc.endpoint}>
      <AuthorizationProvider>
    <SafeAreaView className='h-full'>
    <NavigationContainer>
      <RightDrawerScreen />
    </NavigationContainer>
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
