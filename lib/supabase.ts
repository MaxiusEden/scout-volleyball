import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'

// COPIE E COLE SUAS CHAVES AQUI DENTRO DAS ASPAS:
const supabaseUrl = 'https://bapdeqoexpmdfugkqcaa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcGRlcW9leHBtZGZ1Z2txY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTI4MjQsImV4cCI6MjA3OTc2ODgyNH0.-lnrCgus0n_cJObb49AfWwXfKzWtVZgNxpXuOLN3MA4'

const isServer = typeof window === 'undefined'

const capacitorStorageAdapter = {
    getItem: async (key: string) => {
        if (isServer) return null
        const { value } = await Preferences.get({ key })
        return value
    },
    setItem: async (key: string, value: string) => {
        if (isServer) return
        await Preferences.set({ key, value })
    },
    removeItem: async (key: string) => {
        if (isServer) return
        await Preferences.remove({ key })
    },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: capacitorStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})