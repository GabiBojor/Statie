import { Platform } from 'react-native';

let AudioRecord: any;
let PCMPlayer: any;

if (Platform.OS !== 'web') {
    try {
        AudioRecord = require('react-native-audio-record').default;
        PCMPlayer = require('react-native-pcm-player').default;
    } catch (e) {
        console.warn('Native audio modules not found. Are you running in Expo Go?');
        // Mock to prevent crash in Expo Go before rebuild
        AudioRecord = {
            init: () => { },
            start: () => { },
            stop: () => Promise.resolve(''),
            on: () => { }
        };
        PCMPlayer = {
            play: () => { },
            setVolume: () => { }
        };
    }
} else {
    // Web Mocks
    AudioRecord = {
        init: () => { },
        start: () => { },
        stop: () => Promise.resolve(''),
        on: () => { }
    };
    PCMPlayer = {
        play: () => { },
        setVolume: () => { }
    };
}

export { AudioRecord, PCMPlayer };
