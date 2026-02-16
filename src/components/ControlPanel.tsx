import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated, Easing } from 'react-native';
import { Mic, Power, ChevronUp, ChevronDown, Plus } from 'lucide-react-native';

interface ControlPanelProps {
    onPTTPressIn: () => void;
    onPTTPressOut: () => void;
    onChannelUp: () => void;
    onChannelDown: () => void;
    onPowerToggle: () => void;
    isTransmitting: boolean;
}

export default function ControlPanel({
    onPTTPressIn,
    onPTTPressOut,
    onChannelUp,
    onChannelDown,
    onPowerToggle,
    isTransmitting
}: ControlPanelProps) {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isTransmitting) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotateAnim.setValue(0);
            rotateAnim.stopAnimation();
        }
    }, [isTransmitting]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <TouchableOpacity style={styles.roundButton}>
                    <Plus size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.channelControls}>
                    <TouchableOpacity style={styles.roundButton} onPress={onChannelUp}>
                        <ChevronUp size={24} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roundButton} onPress={onChannelDown}>
                        <ChevronDown size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.roundButton} onPress={onPowerToggle}>
                    <Power size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.pttWrapper}>
                {isTransmitting && (
                    <Animated.View
                        style={[
                            styles.aura,
                            { transform: [{ rotate: rotation }] }
                        ]}
                    />
                )}

                <TouchableOpacity
                    style={[styles.pttButton, isTransmitting && styles.pttActive]}
                    onPressIn={onPTTPressIn}
                    onPressOut={onPTTPressOut}
                    activeOpacity={0.8}
                >
                    <Mic size={32} color={isTransmitting ? '#00FF00' : '#555'} />
                    <Text style={[styles.pttText, isTransmitting && styles.pttTextActive]}>
                        {isTransmitting ? 'LISTENING...' : 'HOLD TO TALK'}
                    </Text>
                    <View style={[styles.pttIndicator, isTransmitting && styles.pttIndicatorActive]} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 0,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    channelControls: {
        flexDirection: 'row',
        gap: 15,
    },
    roundButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1E1E24',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    pttWrapper: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    aura: {
        position: 'absolute',
        width: '105%',
        height: '102%',
        borderWidth: 2,
        borderColor: '#00FF00',
        borderStyle: 'dashed',
        borderRadius: 25,
        opacity: 0.3,
    },
    pttButton: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1A1A20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 25,
        gap: 15,
    },
    pttActive: {
        backgroundColor: '#051505',
        borderColor: '#00FF00',
        shadowColor: "#00FF00",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
    },
    pttText: {
        color: '#888',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 4,
        fontFamily: 'Courier',
    },
    pttTextActive: {
        color: '#00FF00',
        textShadowColor: '#00FF00',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    pttIndicator: {
        width: 80,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#333',
        marginTop: 20,
    },
    pttIndicatorActive: {
        backgroundColor: '#00FF00',
        shadowColor: "#00FF00",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
    }
});

