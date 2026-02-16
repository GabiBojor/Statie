import { create } from 'zustand';

interface StationState {
    channel: number;
    range: number; // in km
    isTransmitting: boolean;
    isReceiving: boolean;
    onlineCount: number;
    isPowerOn: boolean;
    location: { latitude: number; longitude: number } | null;
    lastReceivedTime: string | null;

    // Actions
    setChannel: (channel: number) => void;
    incrementChannel: () => void;
    decrementChannel: () => void;
    setRange: (range: number) => void;
    setTransmitting: (isTransmitting: boolean) => void;
    setReceiving: (isReceiving: boolean) => void;
    setLocation: (location: { latitude: number; longitude: number }) => void;
    setLastReceivedTime: (time: string) => void;
    togglePower: () => void;
    simulateActivity: () => void;
}

export const useStationStore = create<StationState>((set) => ({
    channel: 1,
    range: 5,
    isTransmitting: false,
    isReceiving: false,
    onlineCount: 3,
    isPowerOn: true,
    location: null,
    lastReceivedTime: null,

    setChannel: (channel) => set({ channel }),
    incrementChannel: () => set((state) => ({ channel: Math.min(state.channel + 1, 40) })),
    decrementChannel: () => set((state) => ({ channel: Math.max(state.channel - 1, 1) })),
    setRange: (range) => set({ range }),
    setTransmitting: (isTransmitting) => set({ isTransmitting }),
    setReceiving: (isReceiving) => set({ isReceiving }),
    setLocation: (location) => set({ location }),
    setLastReceivedTime: (time) => set({ lastReceivedTime: time }),
    togglePower: () => set((state) => ({ isPowerOn: !state.isPowerOn })),

    // Local Simulation Helpers
    simulateActivity: () => {
        if (Math.random() > 0.7) {
            set({ isReceiving: true });
            setTimeout(() => set({ isReceiving: false }), 2000);
        }
    }
}));
