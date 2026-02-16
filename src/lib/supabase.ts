import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ptsgcczbwxlcudkdmpgc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c2djY3pid3hsY3Vka2RtcGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDUxNTcsImV4cCI6MjA4NjIyMTE1N30.5sdFmGz6i5CqWSkQfraBKYMNVj52KISfbwf2Ss7Wt8I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
