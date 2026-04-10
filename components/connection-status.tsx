"use client"

import { useState, useEffect } from "react"
import { syncManager } from "@/lib/sync-manager"
import { Wifi, WifiOff } from "lucide-react"

interface ConnectionStatusProps {
  roomId?: string | null
  isSynced?: boolean
}

export default function ConnectionStatus({ roomId, isSynced }: ConnectionStatusProps) {
  const [devices, setDevices] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isSynced || !roomId) {
      setIsConnected(false)
      return
    }

    setIsConnected(true)
    setDevices(syncManager.getConnectedDevices())

    const unsubscribe = syncManager.onMessage((message) => {
      if (message.type === "presence-change") {
        setDevices(syncManager.getConnectedDevices())
      }
    })

    return unsubscribe
  }, [isSynced, roomId])

  if (!isSynced || !roomId) {
    return null
  }

  return (
    <div className="fixed right-4 z-40" style={{ top: `calc(5rem + env(safe-area-inset-top, 0px))` }}>
      <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          {isConnected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
          <span className="text-sm font-medium text-slate-900">{devices.length}/3 Dispositivos</span>
        </div>
        <div className="text-xs space-y-1">
          {devices.map((deviceId) => (
            <div key={deviceId} className="text-slate-600">
              {deviceId}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
