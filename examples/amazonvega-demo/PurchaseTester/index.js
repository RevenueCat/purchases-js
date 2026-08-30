import {AppRegistry} from 'react-native';
import {initializeAppLogs} from './src/app-logs';
import {App} from './src/App';
import {name as appName} from './app.json';

initializeAppLogs();
AppRegistry.registerComponent(appName, () => App);
