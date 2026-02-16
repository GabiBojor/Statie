import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { useStationStore } from '../store/stationStore';
import { Platform } from 'react-native';
// @ts-ignore
import AudioRecord from 'react-native-audio-record';
// @ts-ignore
import PCMPlayer from 'react-native-pcm-player';

export function usePTT() {
    const [isRecording, setIsRecording] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Store
    const channel = useStationStore(state => state.channel);
    const setTransmissionStatus = useStationStore(state => state.setTransmissionStatus);

    // Realtime Subscription
    const subscription = useRef<any>(null);
    const myId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // --- Initialization ---
    useEffect(() => {
        if (Platform.OS !== 'web') {
            // Initialize Recorder
            const options = {
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6,
                wavFile: 'unused.wav'
            };
            AudioRecord.init(options);

            // Listener for recorder data
            AudioRecord.on('data', (base64Data: string) => {
                broadcastAudioChunk(base64Data);
            });
        }

        return () => {
            if (Platform.OS !== 'web') {
                AudioRecord.stop();
            }
        };
    }, []);

    // --- Channel Subscription ---
    useEffect(() => {
        console.log("Setting up Realtime for channel:", channel);

        if (subscription.current) {
            supabase.removeChannel(subscription.current);
        }

        const channelInstance = supabase.channel(`statie-channel-${channel}`);

        channelInstance
            .on('broadcast', { event: 'voice_chunk' }, (payload) => {
                // Filter out my own chunks
                if (payload.payload.sender_id === myId.current) return;

                handleIncomingChunk(payload.payload.data);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed!');
                }
            });

        subscription.current = channelInstance;

        return () => {
            if (subscription.current) supabase.removeChannel(subscription.current);
        }
    }, [channel]);


    // --- Recording Control ---
    async function startRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                const resp = await requestPermission();
                if (resp.status !== 'granted') return;
            }

            setIsRecording(true);
            setTransmissionStatus('TX');

            if (Platform.OS === 'web') {
                startWebRecording();
            } else {
                AudioRecord.start();
            }

        } catch (err) {
            console.error('Failed to start recording', err);
            stopRecording();
        }
    }

    async function stopRecording() {
        setIsRecording(false);
        setTransmissionStatus('STBY');

        if (Platform.OS === 'web') {
            stopWebRecording();
        } else {
            await AudioRecord.stop();
        }
    }


    // --- Web Recording Logic ---
    const mediaRecorderRef = useRef<any>(null);

    function startWebRecording() {
        if (typeof window === 'undefined') return;

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            // Use AudioContext to get raw PCM for compatibility with Mobile Player
            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = context.createMediaStreamSource(stream);
            const processor = context.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16 PCM
                const pcmBuffer = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Convert to Base64
                let binary = '';
                const uint8 = new Uint8Array(pcmBuffer.buffer);
                const len = uint8.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(uint8[i]);
                }
                const base64 = window.btoa(binary);

                broadcastAudioChunk(base64);
            };

            source.connect(processor);
            processor.connect(context.destination);

            mediaRecorderRef.current = {
                stop: () => {
                    processor.disconnect();
                    source.disconnect();
                    context.close();
                    stream.getTracks().forEach(t => t.stop());
                }
            };
        });
    }

    function stopWebRecording() {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
    }


    // --- Broadcasting ---
    async function broadcastAudioChunk(base64Data: string) {
        if (!subscription.current) return;

        await subscription.current.send({
            type: 'broadcast',
            event: 'voice_chunk',
            payload: {
                data: base64Data,
                sender_id: myId.current
            }
        });
    }


    // --- Playback Logic ---
    const rxTimeout = useRef<NodeJS.Timeout | null>(null);

    function handleIncomingChunk(base64Data: string) {
        setReceiving(true);
        setTransmissionStatus('RX');

        if (Platform.OS === 'web') {
            playWebPCM(base64Data);
        } else {
            // Mobile Playback
            PCMPlayer.play(base64Data);
        }

        if (rxTimeout.current) clearTimeout(rxTimeout.current);
        rxTimeout.current = setTimeout(() => {
            setReceiving(false);
            setTransmissionStatus('STBY');
        }, 500);
    }

    // Web PCM Player
    const audioContext = useRef<AudioContext | null>(null);
    const nextStartTime = useRef<number>(0);

    function playWebPCM(base64Data: string) {
        if (typeof window === 'undefined') return;

        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            nextStartTime.current = audioContext.current.currentTime;
        }

        const ctx = audioContext.current;
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const float32 = new Float32Array(len / 2);
        const dataView = new DataView(bytes.buffer);

        for (let i = 0; i < len / 2; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            float32[i] = int16 / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32.length, 16000);
        buffer.getChannelData(0).set(float32);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const playTime = Math.max(ctx.currentTime, nextStartTime.current);
        source.start(playTime);
        nextStartTime.current = playTime + buffer.duration;
    }

    return {
        isRecording,
        receiving,
        startRecording,
        stopRecording
    };
}
