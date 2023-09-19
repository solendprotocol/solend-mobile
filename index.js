/**
 * @format
 */
import {Buffer} from 'buffer';
import 'react-native-get-random-values';
import 'text-encoding-polyfill'
import 'react-native-url-polyfill/auto'
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Mock event listener functions to prevent them from fataling.
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.Buffer = Buffer;

AppRegistry.registerComponent(appName, () => App);
