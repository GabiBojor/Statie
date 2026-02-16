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

    // New Streaming Status
    transmissionStatus: 'TX' | 'RX' | 'STBY';
    setTransmissionStatus: (status: 'TX' | 'RX' | 'STBY') => void;
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

    transmissionStatus: 'STBY',

    setChannel: (channel) => set({ channel }),
    incrementChannel: () => set((state) => ({ channel: Math.min(state.channel + 1, 40) })),
    decrementChannel: () => set((state) => ({ channel: Math.max(state.channel - 1, 1) })),
    setRange: (range) => set({ range }),
    setTransmitting: (isTransmitting) => set({ isTransmitting, transmissionStatus: isTransmitting ? 'TX' : 'STBY' }),
    setReceiving: (isReceiving) => set({ isReceiving, transmissionStatus: isReceiving ? 'RX' : 'STBY' }),
    setLocation: (location) => set({ location }),
    setLastReceivedTime: (time) => set({ lastReceivedTime: time }),
    togglePower: () => set((state) => ({ isPowerOn: !state.isPowerOn })),

    setTransmissionStatus: (status) => set({
        transmissionStatus: status,
        isTransmitting: status === 'TX',
        isReceiving: status === 'RX'
    }),

    // Local Simulation Helpers
    simulateActivity: () => {
        if (Math.random() > 0.7) {
            set({ isReceiving: true, transmissionStatus: 'RX' });
            setTimeout(() => set({ isReceiving: false, transmissionStatus: 'STBY' }), 2000);
        }
    }
}));
