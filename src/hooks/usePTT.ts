import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useStationStore } from '../store/stationStore';
import { supabase } from '../lib/supabase';



export function usePTT() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Store actions
    const channel = useStationStore(state => state.channel);
    const setTransmitting = useStationStore(state => state.setTransmitting);
    const setReceiving = useStationStore(state => state.setReceiving);
    const setLastReceivedTime = useStationStore(state => state.setLastReceivedTime);

    async function startRecording() {
        try {
            if (recording) {
                console.log('Cleaning up existing recording before starting new one...');
                await recording.stopAndUnloadAsync();
                setRecording(null);
            }

            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permission..');
                const response = await requestPermission();
                if (response.status !== 'granted') return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            console.log('Starting recording..');
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setTransmitting(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            setTransmitting(false);
            setRecording(null);
        }
    }

    async function stopRecording() {
        if (!recording) {
            console.log('No active recording to stop');
            setTransmitting(false);
            return;
        }

        try {
            console.log('Stopping recording..');
            const currentRecording = recording;
            setRecording(null); // Clear state immediately to prevent re-entry
            setTransmitting(false);

            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            console.log('Recording stopped and stored at', uri);

            if (uri) {
                uploadAudioAndSend(uri);
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            setTransmitting(false);
            setRecording(null);
        }
    }

    async function uploadAudioAndSend(uri: string) {
        try {
            console.log('Preparing to upload audio from:', uri);
            let fileBody: any;
            let contentType: string;
            let extension: string;

            if (typeof window !== 'undefined' && window.document) {
                // WEB: Fetch the blob from the URI
                const response = await fetch(uri);
                const blob = await response.blob();
                console.log('Web Blob size:', blob.size, 'type:', blob.type);

                if (blob.size === 0) {
                    throw new Error('Recorded blob is empty');
                }

                fileBody = blob;
                contentType = blob.type || 'audio/webm';
                // Extract extension from mime type or default to webm
                extension = contentType.includes('mp4') ? 'm4a' :
                    contentType.includes('webm') ? 'webm' :
                        contentType.includes('ogg') ? 'ogg' : 'wav';
            } else {
                // MOBILE: Use FormData
                const fileName = `audio-${Date.now()}.m4a`;
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri,
                    name: fileName,
                    type: 'audio/m4a',
                });
                fileBody = formData;
                contentType = 'audio/m4a';
                extension = 'm4a';
            }

            const finalFileName = `audio-${Date.now()}.${extension}`;
            console.log('Uploading as:', finalFileName, 'with type:', contentType);

            // 1. Upload File
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('statie-audio')
                .upload(finalFileName, fileBody, {
                    contentType,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('statie-audio')
                .getPublicUrl(finalFileName);

            // 3. Insert Message Record (for history)
            const { error: dbError } = await supabase
                .from('statie_messages')
                .insert({
                    channel: channel,
                    audio_url: publicUrl,
                    created_at: new Date().toISOString()
                });

            if (dbError) throw dbError;

            // 4. ALSO BROADCAST (Faster & more reliable for PTT)
            const channelInstance = supabase.channel(`statie-channel-${channel}`);
            channelInstance.send({
                type: 'broadcast',
                event: 'voice_msg',
                payload: { audio_url: publicUrl, channel: channel }
            });

            console.log('Audio sent successfully!', publicUrl);

        } catch (error) {
            console.error('Error sending audio:', error);
        }
    }

    async function playSound(uri: string) {
        try {
            console.log('Loading Sound', uri);

            // Check if URI is valid
            if (!uri) return;

            // Standardize Audio Mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true, volume: 1.0 },
                (status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setReceiving(false);
                        sound.unloadAsync();
                    }
                }
            );

            setReceiving(true);
        } catch (e) {
            console.error('Error playing sound:', e);
            setReceiving(false);
        }
    }

    // Subscribe to Incoming Audio (Double Pipe: Postgres + Broadcast)
    useEffect(() => {
        console.log(`[Realtime] Subscribing to channel ${channel}...`);

        const subscription = supabase
            .channel(`statie-channel-${channel}`, {
                config: {
                    broadcast: { self: false },
                },
            })
            // Pipe 1: Broadcast (Instant)
            .on(
                'broadcast',
                { event: 'voice_msg' },
                (payload) => {
                    console.log('[Realtime-Broadcast] Message received!', payload);
                    if (payload.payload.channel === channel) {
                        setLastReceivedTime(new Date().toLocaleTimeString() + " (BC)");
                        playSound(payload.payload.audio_url);
                    }
                }
            )
            // Pipe 2: Postgres Changes (Reliability fallback)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'statie_messages',
                    // Removing filter temporarily to be 100% sure we get data
                },
                (payload) => {
                    console.log('[Realtime-Postgres] Message received!', payload.new);
                    // Only play if it matches our channel and we haven't played it yet (ideally)
                    if (payload.new.channel === channel) {
                        setLastReceivedTime(new Date().toLocaleTimeString() + " (DB)");
                        playSound(payload.new.audio_url);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Subscription status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] ✅ Connected to channel ${channel}`);
                }
            });

        return () => {
            console.log(`[Realtime] Unsubscribing from channel ${channel}`);
            subscription.unsubscribe();
        };
    }, [channel]);

    return {
        recording,
        startRecording,
        stopRecording,
        playSound
    };
}
