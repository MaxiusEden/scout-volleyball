"use client"

import { useEffect, useState } from "react"
import { syncQueue, type SyncStatus } from "@/lib/sync-queue"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(syncQueue.getStatus())

  useEffect(() => {
    const unsubscribe = syncQueue.onStatusChange((newStatus: any) => {
      setStatus(newStatus)
    })

    return unsubscribe
  }, [])

  if (!status.isOnline && status.queueLength === 0) {
    return null // Não mostrar se estiver offline e sem pendências
  }

  return (
    <div className="fixed bottom-12 right-4 z-[100]">
      <Badge
        variant={status.isOnline ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {status.isSyncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sincronizando...</span>
          </>
        ) : status.isOnline ? (
          status.queueLength > 0 ? (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>{status.queueLength} pendente{status.queueLength > 1 ? 's' : ''}</span>
            </>
          ) : status.lastSyncTime ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Sincronizado</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </>
          )
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline ({status.queueLength} na fila)</span>
          </>
        )}
      </Badge>
    </div>
  )
}

