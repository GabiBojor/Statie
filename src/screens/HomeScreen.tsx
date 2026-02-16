import React from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StationDisplay from '../components/StationDisplay';
import ControlPanel from '../components/ControlPanel';

import { useStationStore } from '../store/stationStore';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { usePTT } from '../hooks/usePTT';

export default function HomeScreen() {
    useLocationTracking();
    const { startRecording, stopRecording } = usePTT();

    const {
        channel,
        range,
        onlineCount,
        isTransmitting,
        isReceiving,
        lastReceivedTime,
        incrementChannel,
        decrementChannel,
        togglePower
    } = useStationStore();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            <View style={styles.content}>
                {/* Digial Station Display */}
                <StationDisplay
                    channel={channel}
                    range={range}
                    onlineCount={onlineCount}
                    isTransmitting={isTransmitting}
                    isReceiving={isReceiving}
                    lastReceived={lastReceivedTime || undefined}
                />

                {/* Controls */}
                <ControlPanel
                    onPTTPressIn={startRecording}
                    onPTTPressOut={stopRecording}

                    onChannelUp={incrementChannel}
                    onChannelDown={decrementChannel}
                    onPowerToggle={togglePower}
                    isTransmitting={isTransmitting}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        padding: 20,
        paddingBottom: 0,
    }
});
