import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, Radio } from 'lucide-react-native';

interface StationDisplayProps {
    channel: number;
    onlineCount: number;
    range: number;
    isTransmitting: boolean;
    isReceiving: boolean;
    lastReceived?: string;
}

export default function StationDisplay({
    channel,
    onlineCount,
    range,
    isTransmitting,
    isReceiving,
    lastReceived
}: StationDisplayProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.modeText}>Public <Text style={styles.dimmed}>Private</Text></Text>
                <Wifi size={20} color={isTransmitting ? '#ff4444' : '#00FF00'} />
            </View>

            <Text style={styles.channelLabel}>CH {channel}/22</Text>
            <Text style={styles.mainText}>#AppChallenge</Text>

            <View style={styles.statusBar}>
                <View style={styles.statusIndicator}>
                    <View style={[
                        styles.led,
                        isTransmitting ? styles.ledTx : (isReceiving ? styles.ledRx : styles.ledIdle)
                    ]} />
                    <Text style={styles.statusText}>
                        {isTransmitting ? 'TX' : (isReceiving ? 'RX' : 'STBY')}
                    </Text>
                </View>
                {lastReceived && (
                    <Text style={{ color: '#00FF00', fontSize: 10, fontFamily: 'Courier' }}>
                        Last RX: {lastReceived}
                    </Text>
                )}
                <Text style={styles.onlineText}>{onlineCount} ONLINE</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.volumeContainer}>
                    <Radio size={16} color="#00FF00" />
                    <Text style={styles.volumeText}> 25</Text>
                </View>
                <Text style={styles.rangeText}>Range: {range}km</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#002200',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#114411',
        width: '100%',
        aspectRatio: 1.2,
        justifyContent: 'space-between',
        shadowColor: "#00FF00",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modeText: {
        color: '#00FF00',
        fontSize: 14,
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
    dimmed: {
        color: '#004400',
    },
    channelLabel: {
        color: '#008800',
        fontSize: 16,
        fontFamily: 'Courier',
        marginTop: 10,
    },
    mainText: {
        color: '#00FF00',
        fontSize: 28,
        fontFamily: 'Courier', // Ideally a pixel font
        fontWeight: 'bold',
        marginVertical: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statText: {
        color: '#00AA00',
        fontSize: 14,
        fontFamily: 'Courier',
    },
    indicatorContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    transmittingText: {
        color: '#FF0000',
        fontWeight: 'bold',
        fontFamily: 'Courier',
    },
    receivingText: {
        color: '#00FF00',
        fontWeight: 'bold',
        fontFamily: 'Courier',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#003300',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    volumeText: {
        color: '#00FF00',
        marginLeft: 5,
        fontFamily: 'Courier',
    },
    rangeText: {
        color: '#00FF00',
        fontFamily: 'Courier',
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#003300',
        padding: 8,
        borderRadius: 10,
        marginVertical: 10,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    led: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    ledIdle: {
        backgroundColor: '#004400',
    },
    ledTx: {
        backgroundColor: '#ff4444',
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
    ledRx: {
        backgroundColor: '#00FF00',
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
    statusText: {
        color: '#00FF00',
        fontSize: 12,
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
    onlineText: {
        color: '#00FF00',
        fontSize: 12,
        fontFamily: 'Courier',
    }
});
