"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import LoginPage from "@/components/pages/login-page"
import MatchDataEntryPage from "@/components/pages/match-data-entry-page"
import MatchHistoryPage from "@/components/pages/match-history-page"
import RoomConnectionPage from "@/components/pages/room-connection-page"
import { syncManager } from "@/lib/sync-manager"

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<"mode-select" | "history" | "match" | "room">("mode-select")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isSynced, setIsSynced] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem("scoutvolley_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("scoutvolley_user", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("scoutvolley_user")
    setView("mode-select")
  }

  const handleModeSelect = (mode: "individual" | "synced") => {
    if (mode === "individual") {
      setView("match")
      setIsSynced(false)
    } else {
      setView("room")
      setIsSynced(true)
    }
  }

  const handleRoomCreated = (newRoomId: string) => {
    setRoomId(newRoomId)
    setView("match")
  }

  const handleRoomJoined = (newRoomId: string) => {
    setRoomId(newRoomId)
    setView("match")
  }

  useEffect(() => {
    return () => {
      if (roomId) {
        syncManager.leaveRoom()
      }
    }
  }, [roomId])

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }


  if (view === "mode-select") {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Scout Volleyball</h1>
            <p className="text-slate-400">by Lucas Ribeiro da Cunha</p>
            <p className="text-slate-500 text-sm mt-2">Selecione o modo de operação</p>
            {user && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <p className="text-sm text-slate-400">Bem-vindo, {user.name || user.email}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Sair
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleModeSelect("individual")}
            className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all"
          >
            <h2 className="text-xl font-bold mb-2">Coleta Individual</h2>
            <p className="text-sm text-blue-100">Coleta de dados em um único aparelho</p>
          </button>

          <button
            onClick={() => handleModeSelect("synced")}
            className="w-full p-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg transition-all"
          >
            <h2 className="text-xl font-bold mb-2">Coleta Sincronizada</h2>
            <p className="text-sm text-green-100">Até 3 aparelhos conectados em tempo real</p>
          </button>

          <button
            onClick={() => setView("history")}
            className="w-full p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg transition-all"
          >
            <h2 className="text-xl font-bold mb-2">Histórico</h2>
            <p className="text-sm text-purple-100">Visualizar partidas anteriores</p>
          </button>
        </div>
      </div>
    )
  }

  if (view === "history") {
    return (
      <div>
        <button
          onClick={() => setView("mode-select")}
          className="fixed top-2 right-2 px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded-md shadow-lg z-50"
        >
          Menu
        </button>
        <MatchHistoryPage />
      </div>
    )
  }

  if (view === "room") {
    return (
      <RoomConnectionPage
        onRoomCreated={handleRoomCreated}
        onRoomJoined={handleRoomJoined}
        onBack={() => setView("mode-select")}
      />
    )
  }

  return (
    <div>
      <button
        onClick={() => {
          if (roomId) {
            syncManager.leaveRoom()
            setRoomId(null)
          }
          setView("mode-select")
        }}
        className="fixed top-2 right-2 px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded-md shadow-lg z-50"
      >
        Menu
      </button>
      <MatchDataEntryPage roomId={roomId} isSynced={isSynced} />
    </div>
  )
}
