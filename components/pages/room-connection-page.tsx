"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { syncManager } from "@/lib/sync-manager"
import { Copy, Check, Wifi, WifiOff } from 'lucide-react'
import { SubscriptionGuard } from "@/components/subscription-guard"

interface RoomConnectionPageProps {
  onRoomCreated: (roomId: string) => void
  onRoomJoined: (roomId: string) => void
  onBack: () => void
}

export default function RoomConnectionPage({ onRoomCreated, onRoomJoined, onBack }: RoomConnectionPageProps) {
  const [connectionType, setConnectionType] = useState<"create" | "join" | null>(null)
  const [roomId, setRoomId] = useState("")
  const [joinId, setJoinId] = useState("")
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (roomId) {
      // Pega estado inicial
      setConnectedDevices(syncManager.getConnectedDevices())

      // Escuta atualizações de presença
      const unsubscribe = syncManager.onMessage((msg) => {
        if (msg.type === "presence-change") {
            setConnectedDevices(msg.data)
        }
      })
      return unsubscribe
    }
  }, [roomId])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- CORREÇÃO AQUI: Adicionado async/await ---
  const handleCreateRoom = async () => {
    try {
        const newId = await syncManager.createRoom()
        setRoomId(newId) // Agora sim é uma string!
        setConnectionType("create")
        setConnectedDevices(syncManager.getConnectedDevices())
    } catch (e) {
        console.error("Erro ao criar sala:", e)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinId.trim()) {
      setError("Por favor, insira um ID de sala")
      return
    }
    
    // --- CORREÇÃO AQUI: Adicionado async/await ---
    const success = await syncManager.joinRoom(joinId.trim())
    
    if (success) {
      setRoomId(joinId.trim())
      setConnectionType("join")
      setConnectedDevices(syncManager.getConnectedDevices())
      setError("")
    } else {
      setError("Sala cheia ou não encontrada.")
    }
  }

  if (connectionType) {
    return (
      <SubscriptionGuard feature="Coleta sincronizada">
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Scout Volleyball</h1>
              <p className="text-slate-600">
                ID da Sala: {roomId.substring(0, 15)}...
              </p>
            </div>

            <div className="mb-6">
              <Label className="block text-sm font-medium text-slate-700 mb-3">
                Compartilhe este ID:
              </Label>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 p-3 bg-slate-100 rounded-lg font-mono text-sm break-all">
                  {roomId}
                </div>
                <Button
                  onClick={copyToClipboard}
                  className="px-3 bg-slate-600 hover:bg-slate-700 text-white"
                  size="sm"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <Label className="block text-sm font-medium text-slate-700 mb-3">
                Dispositivos Conectados ({connectedDevices.length}/3)
              </Label>
              <div className="space-y-2">
                {connectedDevices.map((deviceId, index) => (
                  <div
                    key={deviceId || index}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <Wifi className={`w-4 h-4 ${deviceId === syncManager.getClientId() ? "text-green-600" : "text-blue-600"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        Dispositivo {deviceId.substring(0, 4)} {deviceId === syncManager.getClientId() ? "(Este)" : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {connectedDevices.length < 3 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <WifiOff className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-600">Aguardando novos dispositivos...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => connectionType === "create" ? onRoomCreated(roomId) : onRoomJoined(roomId)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
              >
                Iniciar Coleta de Dados
              </Button>
              <Button
                onClick={() => {
                  syncManager.leaveRoom()
                  setConnectionType(null)
                  setRoomId("")
                  setJoinId("")
                }}
                variant="outline"
                className="w-full"
              >
                Voltar
              </Button>
              <Button
                  onClick={() => {
                      syncManager.leaveRoom()
                      onBack()
                  }}
                  variant="outline"
                  className="w-full text-slate-700"
              >
                  Menu Principal
              </Button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-slate-700">
                <strong>Sincronização:</strong> Todos os dados de ações são sincronizados em tempo real entre os dispositivos conectados.
              </p>
            </div>
          </Card>
        </div>
      </SubscriptionGuard>
    )
  }

  return (
    <SubscriptionGuard feature="Coleta sincronizada">
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Scout Volleyball</h1>
            <p className="text-slate-600">by Lucas Ribeiro da Cunha</p>
            <p className="text-slate-600 text-sm mt-2">Conexão em Tempo Real</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleCreateRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Wifi className="w-5 h-5" />
              Criar Nova Sala
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-600">ou</span>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">ID da Sala</Label>
              <Input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Cole o ID da sala aqui"
                className="w-full"
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              disabled={!joinId.trim()}
            >
              <Wifi className="w-5 h-5" />
              Conectar à Sala
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-slate-700">
                <strong>Dica:</strong> Crie uma sala no primeiro aparelho e compartilhe o ID com os outros dispositivos para sincronização em tempo real.
              </p>
            </div>

            <Button onClick={onBack} variant="outline" className="w-full bg-transparent">
              Voltar ao Menu Principal
            </Button>
          </div>
        </Card>
      </div>
    </SubscriptionGuard>
  )
}