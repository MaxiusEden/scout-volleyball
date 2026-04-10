"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import EightFaceDataEntry from "@/components/eight-face-entry/eight-face-data-entry"
import ModernStatsDashboard from "@/components/heatmaps/modern-stats-dashboard"
import PlayerStatsSpreadsheet from "@/components/spreadsheets/player-stats-spreadsheet"
import MatchSetupPage from "./match-setup-page"
import { type MatchAction, calculateMatchStats } from "@/lib/match-parser"
import { createEmptyStats } from "@/lib/match-parser"
import { type Set, isSetComplete, getSetWinner, calculateMatchWinner } from "@/lib/set-manager"
import SetDisplay from "@/components/set-display"
import Card from "@/components/ui/card"
import AdvancedAnalyticsCharts from "@/components/charts/advanced-analytics-charts"
import { saveMatch as saveLocal } from "@/lib/match-storage"
import { saveMatchWithQueue } from "@/lib/actions"
import SyncStatusIndicator from "@/components/sync-status-indicator"
import { Notifications } from "@/lib/notifications"
import { syncManager, type SyncMessage } from "@/lib/sync-manager"
import ConnectionStatus from "@/components/connection-status"
import { createEmptyRotation, type CourtRotation } from "@/lib/rotation-manager"
import type { PlayerPosition } from "@/lib/rotation-manager"
import { rotatePositions } from "@/lib/rotation-manager"
import TransitionsDashboard from "@/components/transitions-dashboard"
import type { Player } from "@/components/team-roster-management"
import { generatePDF, generateExcel } from "@/lib/export-utils" // IMPORTEI O NOVO UTILITÁRIO
import { FileText, Table } from 'lucide-react' // Ícones para os botões
import { useToast } from "@/hooks/use-toast"
import { SubscriptionGuard } from "@/components/subscription-guard"

interface MatchData {
  actions: MatchAction[]
  teamAName: string
  teamBName: string
  category: string
  startTime: Date
  teamARotation: CourtRotation
  teamBRotation: CourtRotation
  teamAPlayers: Player[]
  teamBPlayers: Player[]
}

interface MatchDataEntryPageProps {
  roomId?: string | null
  isSynced?: boolean
  userRole?: "host" | "guest"
}

export default function MatchDataEntryPage({ roomId, isSynced, userRole = "host" }: MatchDataEntryPageProps) {
  const [matchStarted, setMatchStarted] = useState(false)
  const [activeTab, setActiveTab] = useState(userRole === "host" ? "entry" : "stats")
  const { toast } = useToast()

  const [matchData, setMatchData] = useState<MatchData>({
    actions: [],
    teamAName: "Time A",
    teamBName: "Time B",
    category: "adult",
    startTime: new Date(),
    teamARotation: createEmptyRotation("A"),
    teamBRotation: createEmptyRotation("B"),
    teamAPlayers: [],
    teamBPlayers: [],
  })

  const [sets, setSets] = useState<Set[]>([])
  const [currentSet, setCurrentSet] = useState<Set>({
    number: 1,
    teamAScore: 0,
    teamBScore: 0,
  })

  // ESTADO NOVO: Controla se o jogo acabou e sincroniza isso
  const [matchComplete, setMatchComplete] = useState(false)

  const [showMatchSummary, setShowMatchSummary] = useState(false)
  const [waitingSave, setWaitingSave] = useState(false)
  const [stats, setStats] = useState({ statsA: createEmptyStats(), statsB: createEmptyStats() })
  
  // UX State
  const [isExporting, setIsExporting] = useState<string | null>(null)

  // Função auxiliar para enviar estado completo
  const broadcastState = (isComplete: boolean, currentSets: Set[], currSet: Set) => {
    if (isSynced && roomId && userRole === 'host') {
      console.log("📤 Host enviando estado. Completo?", isComplete);
      syncManager.broadcast({
        type: "state",
        data: {
          matchData,
          sets: currentSets,
          currentSet: currSet,
          matchStarted: true,
          matchComplete: isComplete,
          stats
        }
      } as any)
    }
  }

  const processAction = useCallback((action: MatchAction, isRemote: boolean = false) => {
    let pointScoredBy: "A" | "B" | undefined = undefined

    if (action.serveQuality === "ka") pointScoredBy = action.servingTeam as "A" | "B"
    else if (action.serveQuality === "-") pointScoredBy = (action.servingTeam === "A" ? "B" : "A") as "A" | "B"
    else if (action.passingQuality === "D") pointScoredBy = action.servingTeam as "A" | "B"
    else if (action.resultComplemento === "#") pointScoredBy = action.attackingTeam as "A" | "B"
    else if (action.resultComplemento === "!") pointScoredBy = (action.attackingTeam === "A" ? "B" : "A") as "A" | "B"
    else if (action.resultComplemento === "+") pointScoredBy = (action.attackingTeam === "A" ? "B" : "A") as "A" | "B"

    const enrichedAction: MatchAction = {
      ...action,
      setNumber: currentSet.number,
      pointScoredBy,
    }

    const updatedActions = [...matchData.actions, enrichedAction]
    let newTeamARotation = matchData.teamARotation
    let newTeamBRotation = matchData.teamBRotation

    if (matchData.actions.length > 0) {
      const previousAction = matchData.actions[matchData.actions.length - 1]
      if (previousAction.servingTeam === "A" && action.servingTeam === "B") {
        newTeamBRotation = { ...matchData.teamBRotation, currentRotation: rotatePositions(matchData.teamBRotation.currentRotation), rotationHistory: [...matchData.teamBRotation.rotationHistory, matchData.teamBRotation.currentRotation] }
      } else if (previousAction.servingTeam === "B" && action.servingTeam === "A") {
        newTeamARotation = { ...matchData.teamARotation, currentRotation: rotatePositions(matchData.teamARotation.currentRotation), rotationHistory: [...matchData.teamARotation.rotationHistory, matchData.teamARotation.currentRotation] }
      }
    }

    setMatchData(prev => ({
      ...prev,
      actions: updatedActions,
      teamARotation: newTeamARotation,
      teamBRotation: newTeamBRotation,
    }))

    if (!isRemote && isSynced && roomId && userRole === 'host') {
      syncManager.broadcast({
        type: "action",
        data: enrichedAction,
      } as any)
    }

    const newStats = calculateMatchStats(updatedActions)
    setStats(newStats)

    const currentSetActions = updatedActions.filter((a) => updatedActions.indexOf(a) >= sets.reduce((sum, s) => sum + (s.teamAScore + s.teamBScore), 0))
    const currentSetStats = calculateMatchStats(currentSetActions)

    const updatedSet = {
      ...currentSet,
      teamAScore: currentSetStats.statsA.points,
      teamBScore: currentSetStats.statsB.points,
    }

    if (isSetComplete(updatedSet.teamAScore, updatedSet.teamBScore)) {
      const winner = getSetWinner(updatedSet.teamAScore, updatedSet.teamBScore)
      const completedSet = { ...updatedSet, winner: winner as "A" | "B", completedAt: new Date() }
      const newSets = [...sets, completedSet]
      setSets(newSets)

      const matchWinner = calculateMatchWinner(newSets)
      if (matchWinner || newSets.length === 5) {
        const isComplete = true;
        setMatchComplete(isComplete)
        if (userRole === 'host') {
          setShowMatchSummary(true);
          setWaitingSave(true);
          // AVISA GUEST QUE ACABOU
          broadcastState(isComplete, newSets, updatedSet);
        }
      } else {
        setCurrentSet({ number: newSets.length + 1, teamAScore: 0, teamBScore: 0 })
      }
    } else {
      setCurrentSet(updatedSet)
    }
  }, [matchData, currentSet, sets, isSynced, roomId, userRole])

  useEffect(() => {
    if (!isSynced || !roomId) return

    if (userRole === 'guest') {
      setTimeout(() => {
        console.log("📡 Guest solicitando estado...")
        syncManager.broadcast({ type: "request-state", data: null } as any)
      }, 1000)
    }

    const unsubscribe = syncManager.onMessage((message: SyncMessage) => {
      if (message.type === "action") {
        processAction(message.data as MatchAction, true)
      }
      else if (message.type === "request-state" && userRole === 'host') {
        // Host envia estado atual para quem pediu
        broadcastState(matchComplete, sets, currentSet);
      }
      else if (message.type === "state" && userRole === 'guest') {
        console.log("📥 Guest recebeu estado!", message.data)
        const state = message.data
        setMatchData({
          ...state.matchData,
          startTime: new Date(state.matchData.startTime)
        })
        setSets(state.sets)
        setCurrentSet(state.currentSet)
        setMatchStarted(state.matchStarted)
        setStats(state.stats)
        // SE O ESTADO DIZ QUE ACABOU, GUEST VAI PARA TELA DE RESUMO
        if (state.matchComplete) {
          setMatchComplete(true)
          setShowMatchSummary(true)
        }
      }
    })

    return unsubscribe
  }, [isSynced, roomId, userRole, matchData, sets, currentSet, matchStarted, stats, processAction, matchComplete])

  const handleSetup = (teamAName: string, teamBName: string, category: string, teamAPlayers: Player[], teamBPlayers: Player[]) => {
    const initialData = {
      actions: [],
      teamAName,
      teamBName,
      category,
      startTime: new Date(),
      teamARotation: createEmptyRotation("A"),
      teamBRotation: createEmptyRotation("B"),
      teamAPlayers,
      teamBPlayers,
    }
    setMatchData(initialData)
    setStats({ statsA: createEmptyStats(), statsB: createEmptyStats() })
    setSets([])
    setCurrentSet({ number: 1, teamAScore: 0, teamBScore: 0 })
    setMatchComplete(false)
    setMatchStarted(true)

    if (isSynced && userRole === 'host') {
      setTimeout(() => {
        broadcastState(false, [], { number: 1, teamAScore: 0, teamBScore: 0 })
      }, 500)
    }
  }

  const handleNewAction = (action: MatchAction) => {
    processAction(action, false)
  }
  const handleEndSet = () => {
    if (userRole === 'guest') return

    // Só encerra se o placar não estiver 0x0
    if (currentSet.teamAScore > 0 || currentSet.teamBScore > 0) {
      const winner = currentSet.teamAScore > currentSet.teamBScore ? "A" : "B"

      // 1. Cria o set finalizado
      const completedSet = {
        ...currentSet,
        winner: winner as "A" | "B",
        completedAt: new Date(),
      }

      // 2. Atualiza a lista de sets
      const newSets = [...sets, completedSet]
      setSets(newSets)

      // 3. Verifica se o jogo acabou com esse set
      const matchWinner = calculateMatchWinner(newSets)

      if (matchWinner || newSets.length === 5) {
        // Fim de jogo
        const isComplete = true
        setMatchComplete(isComplete)
        if (userRole === 'host') {
          setShowMatchSummary(true)
          setWaitingSave(true)
          // Sincroniza o fim
          broadcastState(isComplete, newSets, currentSet)
        }
      } else {
        // Inicia novo set
        const nextSet = { number: newSets.length + 1, teamAScore: 0, teamBScore: 0 }
        setCurrentSet(nextSet)

        // Sincroniza o início do novo set
        if (isSynced && roomId && userRole === 'host') {
          syncManager.broadcast({
            type: "state",
            data: {
              matchData,
              sets: newSets,
              currentSet: nextSet,
              matchStarted: true,
              matchComplete: false,
              stats
            }
          } as any)
        }
      }
    }
  }

  const handleFinishMatch = () => {
    // Acionamento manual do fim de jogo pelo Host
    const isComplete = true;
    setMatchComplete(isComplete)
    setShowMatchSummary(true)
    setWaitingSave(true)
    broadcastState(isComplete, sets, currentSet)
  }

  const handleSaveMatch = async () => {
    try {
      const winner = (sets.filter((s) => s.winner === "A").length >= 3 ? "A" : "B") as "A" | "B"
      const totalDuration = Math.floor((new Date().getTime() - matchData.startTime.getTime()) / 1000)
      const matchToSave = {
        teamAName: matchData.teamAName,
        teamBName: matchData.teamBName,
        category: matchData.category,
        sets,
        actions: matchData.actions,
        totalDuration,
        createdAt: matchData.startTime,
        completedAt: new Date(),
        winner,
      }

      // Salvar localmente primeiro
      try {
        saveLocal(matchToSave)
        await Notifications.matchSaved(matchToSave.teamAName, matchToSave.teamBName)
        toast({
          title: "Partida salva localmente",
          description: "Os dados foram salvos no dispositivo.",
          variant: "default",
        })
      } catch (localError) {
        console.error("[ERROR] Failed to save locally:", localError)
        toast({
          title: "Erro ao salvar localmente",
          description: "Não foi possível salvar a partida no dispositivo.",
          variant: "destructive",
        })
      }

      // Tentar salvar na nuvem (com fila de sincronização)
      try {
        const resultado = await saveMatchWithQueue(matchToSave)
        if (resultado.success) {
          if ('queued' in resultado && resultado.queued) {
            toast({
              title: "Adicionado à fila",
              description: ('message' in resultado ? resultado.message : null) || "A partida será sincronizada quando a conexão for restaurada.",
              variant: "default",
            })
          } else {
            await Notifications.syncSuccess()
            toast({
              title: "Salvo na nuvem",
              description: "A partida foi sincronizada com sucesso.",
              variant: "default",
            })
          }
        } else {
          await Notifications.syncError(resultado.error || "Erro desconhecido")
          toast({
            title: "Erro ao salvar na nuvem",
            description: resultado.error || "Não foi possível sincronizar com a nuvem.",
            variant: "destructive",
          })
        }
      } catch (cloudError: any) {
        console.error("[ERROR] Failed to save to cloud:", cloudError)
        toast({
          title: "Erro de conexão",
          description: cloudError?.message || "Não foi possível conectar com o servidor.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[ERROR] Unexpected error in handleSaveMatch:", error)
      toast({
        title: "Erro inesperado",
        description: error?.message || "Ocorreu um erro ao salvar a partida.",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    setMatchStarted(false)
    setMatchComplete(false)
    setShowMatchSummary(false)
    setWaitingSave(false)
    setMatchData({ ...matchData, actions: [] })
  }

  // HANDLERS DE EXPORTAÇÃO
  const handleExportPDF = async (type: 'A' | 'B' | 'BOTH') => {
    setIsExporting(type)
    try {
      await generatePDF(matchData, stats, sets, type);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
    }
  }
  const handleExportExcel = () => {
    generateExcel(matchData, stats, sets);
  }

  if (!matchStarted) {
    if (userRole === 'guest') {
      return (
        <SubscriptionGuard feature="Coleta sincronizada">
          <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4 text-center">
            <div className="animate-pulse mb-4 text-4xl">📡</div>
            <h1 className="text-2xl font-bold mb-2">Aguardando o Scout...</h1>
            <p className="text-slate-400">Você está conectado como espectador.</p>
            <p className="text-slate-500 text-sm mt-4">O jogo aparecerá aqui automaticamente quando o Host iniciar.</p>
          </div>
        </SubscriptionGuard>
      )
    }
    return (
      <SubscriptionGuard feature="Coleta de dados">
        <MatchSetupPage onSetup={handleSetup} />
      </SubscriptionGuard>
    )
  }

  // TELA DE FIM DE JOGO (COM BOTÕES FUNCIONAIS AGORA)
  if (matchComplete || waitingSave) {
    const winner = sets.filter((s) => s.winner === "A").length >= 3 ? "A" : "B"

    return (
      <SubscriptionGuard feature="Resumo e exportação de partida">
        <div className="w-full h-screen bg-background overflow-auto pb-20">
          <Tabs defaultValue="stats" className="w-full">
            <div className="flex items-center justify-between px-4 border-b p-4 bg-white safe-top">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start">
                <TabsTrigger className="data-[state=active]:bg-slate-200" value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-slate-200" value="spreadsheet">Planilha</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-slate-200" value="charts">Gráficos</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-slate-200" value="transitions">Transições</TabsTrigger>
                <TabsTrigger className="data-[state=active]:bg-slate-200" value="export">Exportar</TabsTrigger>
              </TabsList>
              <Button onClick={handleReset} variant="outline" size="sm" className="hidden sm:flex">
                Fechar Resumo
              </Button>
            </div>

            <TabsContent value="stats" className="p-4">
              <div className="p-4 bg-blue-50 rounded-lg mb-4 text-center border border-blue-200">
                <h2 className="text-2xl font-bold text-slate-800">Fim de Jogo!</h2>
                <p className="text-lg text-slate-600">Vencedor: <span className="font-bold text-blue-600">{winner === 'A' ? matchData.teamAName : matchData.teamBName}</span></p>
              </div>
              <ModernStatsDashboard stats={stats} teamAName={matchData.teamAName} teamBName={matchData.teamBName} actions={matchData.actions} sets={sets} />
            </TabsContent>

            <TabsContent value="charts" className="p-4">
              <AdvancedAnalyticsCharts actions={matchData.actions} sets={sets} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
            </TabsContent>

            <TabsContent value="spreadsheet" className="p-4">
              <PlayerStatsSpreadsheet actions={matchData.actions} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
            </TabsContent>

            <TabsContent value="transitions" className="p-4">
              <TransitionsDashboard actions={matchData.actions} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
            </TabsContent>

            {/* ABA DE EXPORTAÇÃO FUNCIONAL */}
            <TabsContent value="export" className="p-6 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Exportar PDF</h3>
                <div className="grid gap-3">
                  <Button onClick={() => handleExportPDF('A')} disabled={isExporting !== null} variant="outline" className="w-full">
                    {isExporting === 'A' ? 'Gerando...' : `Relatório ${matchData.teamAName}`}
                  </Button>
                  <Button onClick={() => handleExportPDF('B')} disabled={isExporting !== null} variant="outline" className="w-full">
                    {isExporting === 'B' ? 'Gerando...' : `Relatório ${matchData.teamBName}`}
                  </Button>
                  <Button onClick={() => handleExportPDF('BOTH')} disabled={isExporting !== null} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isExporting === 'BOTH' ? 'Gerando PDF. Aguarde...' : 'Relatório Completo'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Table className="w-5 h-5" /> Exportar Excel</h3>
                <Button onClick={handleExportExcel} className="w-full bg-green-600 hover:bg-green-700 text-white">Baixar Planilha .xlsx</Button>
              </Card>
            </TabsContent>
          </Tabs>

          {userRole === 'host' && (
            <div className="fixed bottom-4 right-4 space-x-2 z-50">
              <Button onClick={handleSaveMatch} className="bg-green-600 shadow-lg">Salvar na Nuvem</Button>
              <Button onClick={handleReset} variant="destructive" className="shadow-lg">Sair / Novo Jogo</Button>
            </div>
          )}

          {userRole === 'guest' && (
            <div className="fixed bottom-4 right-4 z-50">
              <Button onClick={handleReset} variant="outline" className="bg-white shadow-lg">Sair da Sala</Button>
            </div>
          )}
          <SyncStatusIndicator />
        </div>
      </SubscriptionGuard>
    )
  }

  return (
    <SubscriptionGuard feature="Coleta de dados e análise" disablePeriodic>
      <div className="w-full h-screen bg-background">
        {isSynced && <ConnectionStatus roomId={roomId} isSynced={isSynced} />}

        <div className="border-b p-4 bg-card safe-top">
          <div className="flex items-center justify-center mb-3">
            <SetDisplay sets={sets} currentSet={currentSet} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
          </div>

          {userRole === 'host' && (
            <div className="flex justify-center gap-2">
              <Button onClick={handleEndSet} variant="outline" size="sm">Encerrar Set</Button>
              <Button onClick={handleFinishMatch} variant="destructive" size="sm">Finalizar Partida</Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          <div className="w-full border-b overflow-x-auto">
            <div className="flex items-center justify-between px-4 gap-4">
              <TabsList className="flex w-max min-w-max justify-start rounded-none border-b-0">
                {userRole === 'host' && <TabsTrigger value="entry">Coleta</TabsTrigger>}
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="spreadsheet">Planilha</TabsTrigger>
                <TabsTrigger value="charts">Gráficos</TabsTrigger>
                <TabsTrigger value="transitions">Transições</TabsTrigger>
                <TabsTrigger value="export">Exportar</TabsTrigger>
              </TabsList>
              <Button onClick={handleReset} variant="outline" size="sm" className="whitespace-nowrap flex-shrink-0">
                Sair da Partida
              </Button>
            </div>
          </div>

          {userRole === 'host' && (
            <TabsContent value="entry" className="flex-1 overflow-y-auto">
              <EightFaceDataEntry
                onActionComplete={handleNewAction}
                teamAName={matchData.teamAName}
                teamBName={matchData.teamBName}
                teamAScore={currentSet.teamAScore}
                teamBScore={currentSet.teamBScore}
                teamAPlayers={matchData.teamAPlayers}
                teamBPlayers={matchData.teamBPlayers}
              />
            </TabsContent>
          )}

          <TabsContent value="stats" className="flex-1 overflow-y-auto p-4">
            <ModernStatsDashboard stats={stats} teamAName={matchData.teamAName} teamBName={matchData.teamBName} actions={matchData.actions} sets={sets} />
          </TabsContent>

          <TabsContent value="charts" className="flex-1 overflow-y-auto p-4">
            <AdvancedAnalyticsCharts actions={matchData.actions} sets={sets} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
          </TabsContent>

          <TabsContent value="spreadsheet" className="flex-1 overflow-y-auto p-4">
            <PlayerStatsSpreadsheet actions={matchData.actions} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
          </TabsContent>

          <TabsContent value="transitions" className="flex-1 overflow-y-auto p-4">
            <TransitionsDashboard actions={matchData.actions} teamAName={matchData.teamAName} teamBName={matchData.teamBName} />
          </TabsContent>

          <TabsContent value="export" className="flex-1 overflow-y-auto p-6">
            <Card className="p-6 mb-4">
              <h3 className="text-lg font-bold mb-4">Exportar Parcial (PDF)</h3>
              <Button onClick={() => handleExportPDF('BOTH')} disabled={isExporting !== null} className="w-full text-white bg-slate-800 hover:bg-slate-700">
                {isExporting === 'BOTH' ? 'Gerando PDF. Aguarde...' : 'Baixar Relatório Atual'}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
        <SyncStatusIndicator />
      </div>
    </SubscriptionGuard>
  )
}