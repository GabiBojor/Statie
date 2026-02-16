import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useStationStore } from '../store/stationStore';

export function useLocationTracking() {
    const setLocation = useStationStore(state => state.setLocation);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                // Initial location with fallback
                try {
                    let location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    setLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });
                } catch (e) {
                    console.log('Initial location failed, waiting for watch...', e);
                }

                // Track changes
                await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                        distanceInterval: 10
                    },
                    (newLocation) => {
                        setLocation({
                            latitude: newLocation.coords.latitude,
                            longitude: newLocation.coords.longitude
                        });
                    }
                );
            } catch (err) {
                console.error('Location tracking error:', err);
                setErrorMsg('Error initializing location tracking');
            }
        })();
    }, []);

    return { errorMsg };
}
