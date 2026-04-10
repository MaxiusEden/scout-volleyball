"use client"

import { useState, useEffect, useRef } from "react"
import { Capacitor } from '@capacitor/core'
import { AppHeader } from "@/components/app-header"
import LoginPage from "@/components/pages/login-page"
import MatchDataEntryPage from "@/components/pages/match-data-entry-page"
import MatchHistoryPage from "@/components/pages/match-history-page"
import RoomConnectionPage from "@/components/pages/room-connection-page"
import { syncManager } from "@/lib/sync-manager"
import { supabase } from "@/lib/supabase"
import SubscriptionDialog from "@/components/subscription-dialog"

import { useSubscription } from "@/hooks/use-subscription"

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032'
const logDebug = (location: string, message: string, data: any = {}) => {
  if (typeof window === 'undefined') return
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data: { ...data, userAgent: navigator.userAgent, platform: typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'web' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => { })
}
// #endregion

export default function Page() {
  // #region agent log
  useEffect(() => {
    logDebug('app/page.tsx:Page', 'Component mounted', { hasWindow: typeof window !== 'undefined', hasLocalStorage: typeof localStorage !== 'undefined' })
  }, [])
  // #endregion

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<"mode-select" | "history" | "match" | "room">("mode-select")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  // NOVO: Define se é o Dono da sala (Scout) ou Espectador
  const [userRole, setUserRole] = useState<"host" | "guest">("host")
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  // Verificar assinatura quando autenticado
  const { hasAccess: subscriptionAccess, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscription()

  // #region agent log
  useEffect(() => {
    logDebug('app/page.tsx:useEffect-auth', 'Checking authentication', { hasLocalStorage: typeof localStorage !== 'undefined' })
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (session?.user && !error) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
          }
          setUser(userData)
          setIsAuthenticated(true)
          localStorage.setItem("scoutvolley_user", JSON.stringify(userData))
          return
        }
      } catch (err) {
        console.error("Error restoring session from supabase:", err)
      }

      // Fallback to localStorage (especially useful when offline)
      try {
        const storedUser = localStorage.getItem("scoutvolley_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error("Error restoring from localStorage:", err)
      }
    }

    restoreSession()
  }, [])

  // Keep state refs updated for the event listener
  const stateRef = useRef({ view, isAuthenticated, roomId, userRole });
  useEffect(() => {
    stateRef.current = { view, isAuthenticated, roomId, userRole };
  }, [view, isAuthenticated, roomId, userRole]);

  // GLOBAL BACK BUTTON HANDLER (Persistent)
  useEffect(() => {
    let backListener: any;
    const setupBackListener = async () => {
      const { App } = await import('@capacitor/app');

      // Remove any existing listeners first to be safe
      await App.removeAllListeners();

      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        const { view, isAuthenticated, roomId } = stateRef.current; // Read latest state from ref

        logDebug('app/page.tsx:backButton', 'Back button pressed', { view, isAuthenticated, roomId, canGoBack });

        if (!isAuthenticated) {
          if (canGoBack) window.history.back(); else App.exitApp();
          return;
        }

        if (view === 'mode-select') {
          // Home Screen: Exit app (or minimize)
          App.exitApp();
        } else {
          // Sub-screens: Go back to Home
          if (roomId) {
            syncManager.leaveRoom();
            setRoomId(null);
          }
          setView('mode-select');
        }
      });
    };
    setupBackListener();

    // Cleanup on unmount only
    return () => {
      if (backListener) backListener.remove();
    };
  }, []); // Run ONCE on mount

  const handleLoginSuccess = (userData: any) => {
    // #region agent log
    logDebug('app/page.tsx:handleLoginSuccess', 'Login success', { userId: userData?.id, userEmail: userData?.email })
    // #endregion
    try {
      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem("scoutvolley_user", JSON.stringify(userData))
      // #region agent log
      logDebug('app/page.tsx:handleLoginSuccess', 'User saved to localStorage')
      // #endregion
    } catch (error: any) {
      // #region agent log
      logDebug('app/page.tsx:handleLoginSuccess', 'Error saving user', { error: error?.message })
      // #endregion
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("scoutvolley_user")
    setView("mode-select")
  }

  const handleModeSelect = (mode: "individual" | "synced") => {
    // Verificar assinatura antes de navegar
    if (!subscriptionAccess && !subscriptionLoading) {
      setShowSubscriptionDialog(true)
      return
    }
    if (mode === "individual") {
      setView("match")
      setIsSynced(false)
      setUserRole("host") // Individual é sempre host
    } else {
      setView("room")
      setIsSynced(true)
    }
  }

  const handleHistoryClick = () => {
    if (!subscriptionAccess && !subscriptionLoading) {
      setShowSubscriptionDialog(true)
      return
    }
    setView("history")
  }

  // Quem CRIA a sala é o HOST (pode anotar)
  const handleRoomCreated = (newRoomId: string) => {
    setRoomId(newRoomId)
    setUserRole("host")
    setView("match")
  }

  // Quem ENTRA na sala é GUEST (só vê gráficos)
  const handleRoomJoined = (newRoomId: string) => {
    setRoomId(newRoomId)
    setUserRole("guest")
    setView("match")
  }

  useEffect(() => {
    return () => {
      if (roomId) {
        syncManager.leaveRoom()
      }
    }
  }, [roomId])

  // #region agent log
  useEffect(() => {
    logDebug('app/page.tsx:render-check', 'Render state', { isAuthenticated, hasUser: !!user, view, roomId })
  }, [isAuthenticated, user, view, roomId])
  // #endregion

  if (!isAuthenticated) {
    // #region agent log
    logDebug('app/page.tsx:render', 'Rendering LoginPage')
    // #endregion
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  if (view === "mode-select") {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 relative">

        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Scout Volleyball</h1>
            <p className="text-slate-400">by Lucas Ribeiro da Cunha e Filipe Pereira Machado</p>
            <p className="text-slate-500 text-sm mt-2">Selecione o modo de operação</p>
            {user && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <p className="text-sm text-slate-400">Bem-vindo, {user.name || user.email}</p>
                <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 underline">
                  Sair
                </button>
              </div>
            )}
          </div>

          <button onClick={() => handleModeSelect("individual")} className="w-full p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all">
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

          <button onClick={handleHistoryClick} className="w-full p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg transition-all">
            <h2 className="text-xl font-bold mb-2">Histórico</h2>
            <p className="text-sm text-purple-100">Visualizar partidas anteriores</p>
          </button>
        </div>

        {/* Dialog de assinatura quando usuário tenta acessar sem plano */}
        <SubscriptionDialog
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          onSuccess={() => refreshSubscription()}
        />
      </div>
    )
  }

  if (view === "history") {
    return (
      <div>

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

      {/* Passamos o userRole para a página do jogo */}
      <MatchDataEntryPage roomId={roomId} isSynced={isSynced} userRole={userRole} />
    </div>
  )
}