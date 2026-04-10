import { supabase } from "@/lib/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

export type SyncMessage = {
  type: "action" | "state" | "request-state" | "presence-change"
  data: any
  timestamp: number
  senderId: string
}

class SyncManager {
  private channel: RealtimeChannel | null = null
  private listeners: ((message: SyncMessage) => void)[] = []
  // Mudança: Usamos um prefixo fixo para garantir que seja string
  private clientId: string = "user_" + Math.floor(Math.random() * 1000000).toString()
  private connectedDevices: string[] = []

  constructor() {
    this.connectedDevices = [this.clientId]
  }

  public getConnectedDevices(): string[] {
    return [...this.connectedDevices]
  }

  public getClientId(): string {
    return this.clientId
  }

  public getDeviceId(): string {
    return this.clientId
  }

  public async createRoom(roomId?: any): Promise<string> {
    let finalRoomId = ""
    
    // Sanitização extrema
    try {
        if (roomId && typeof roomId === "string" && roomId.trim().length > 0) {
            finalRoomId = roomId.trim()
        } else {
            // Gera ID numérico convertido para string para evitar erros de substring
            const randomPart = Math.floor(Math.random() * 1000000).toString()
            finalRoomId = "ROOM_" + randomPart
        }
    } catch (e) {
        finalRoomId = "ROOM_FALLBACK"
    }

    await this.joinRoom(finalRoomId)
    return finalRoomId
  }

  public async joinRoom(roomId: any): Promise<boolean> {
    const cleanRoomId = String(roomId || "ROOM_ERROR").trim()

    console.log(`🛡️ Tentando conectar na sala: ${cleanRoomId}`)

    if (this.channel) this.leaveRoom()

    try {
        // Configuração simplificada do canal
        this.channel = supabase.channel(cleanRoomId, {
          config: {
            broadcast: { self: false },
            presence: { key: this.clientId },
          },
        })

        this.channel
          .on("broadcast", { event: "sync-event" }, (payload) => {
            if (payload.payload) {
              this.notifyListeners(payload.payload as SyncMessage)
            }
          })
          .on("presence", { event: "sync" }, () => {
            const state = this.channel?.presenceState()
            if (state) {
                this.connectedDevices = Object.keys(state)
                console.log("👥 Dispositivos atualizados:", this.connectedDevices)
                
                this.notifyListeners({
                    type: "presence-change",
                    data: [...this.connectedDevices],
                    timestamp: Date.now(),
                    senderId: "system"
                })
            }
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              console.log(`✅ SUCESSO: Conectado no canal ${cleanRoomId}`)
              await this.channel?.track({ online_at: new Date().toISOString() })
            }
          })

        return true
    } catch (error) {
        console.error("Erro fatal no joinRoom:", error)
        return false
    }
  }

  public leaveRoom() {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
      this.connectedDevices = [this.clientId]
    }
  }

  public async broadcast(message: Omit<SyncMessage, "timestamp" | "senderId">) {
    if (!this.channel) return

    const fullMessage: SyncMessage = {
      ...message,
      timestamp: Date.now(),
      senderId: this.clientId,
    }

    await this.channel.send({
      type: "broadcast",
      event: "sync-event",
      payload: fullMessage,
    })
  }

  public onMessage(callback: (message: SyncMessage) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  private notifyListeners(message: SyncMessage) {
    this.listeners.forEach((listener) => {
        try { listener(message) } catch (e) { console.error(e) }
    })
  }
}

export const syncManager = new SyncManager()