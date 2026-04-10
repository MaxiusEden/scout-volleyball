"use client"

import { useState, useEffect, useMemo } from "react"
import { type StoredMatch, getMatchById } from "@/lib/match-storage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from 'lucide-react'
import { calculateTeamStats, type TeamStats } from "@/lib/match-parser"
import ModernStatsDashboard from "@/components/heatmaps/modern-stats-dashboard"
import { AdvancedAnalyticsDashboard } from "@/components/heatmaps/advanced-analytics-dashboard"
import AdvancedAnalyticsCharts from "@/components/charts/advanced-analytics-charts"
import TransitionsDashboard from "@/components/transitions-dashboard"
import { SetProgressionVisualization } from "@/components/set-progression-visualization"
import ShareMatchButton from "@/components/share-match-button"
import { ThemeToggle } from "@/components/theme-toggle"

interface MatchDetailsPageProps {
  matchId: string
  onBack: () => void
}

export default function MatchDetailsPage({ matchId, onBack }: MatchDetailsPageProps) {
  const [match, setMatch] = useState<StoredMatch | null>(null)
  const [selectedSet, setSelectedSet] = useState<number>(0)

  useEffect(() => {
    const foundMatch = getMatchById(matchId)
    setMatch(foundMatch)
  }, [matchId])

  const teamStats = useMemo(() => {
    if (!match || !match.actions) return null

    const statsA = calculateTeamStats(match.actions, "A")
    const statsB = calculateTeamStats(match.actions, "B")

    return {
      statsA,
      statsB,
      teamA: { name: match.teamAName, actions: match.actions.filter(a => a.servingTeam === "A" || a.attackingTeam === "A"), stats: statsA },
      teamB: { name: match.teamBName, actions: match.actions.filter(a => a.servingTeam === "B" || a.attackingTeam === "B"), stats: statsB },
    }
  }, [match])

  if (!match) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Partida não encontrada</p>
          <Button onClick={onBack}>Voltar</Button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const selectedSetData = match.sets[selectedSet]
  const setActions = match.actions.filter((a) => a.setNumber === selectedSet + 1)

  return (
    <div className="w-full min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Detalhes da Partida</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <ThemeToggle />
            {match && (
              <ShareMatchButton
                matchId={match.id}
                matchName={`${match.teamAName} vs ${match.teamBName}`}
              />
            )}
          </div>
        </div>

        {/* Match Overview */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{match.teamAName}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sets vencidos: {match.sets.filter((s) => s.teamAScore > s.teamBScore).length}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{match.teamBName}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sets vencidos: {match.sets.filter((s) => s.teamBScore > s.teamAScore).length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Badge variant="default" className="text-xs sm:text-sm">Vencedor: {match.winner === "A" ? match.teamAName : match.teamBName}</Badge>
            </div>
            <div className="text-left sm:text-center">
              <Badge variant="outline" className="text-xs sm:text-sm">{match.category}</Badge>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatDate(match.completedAt)} • Duração: {formatDuration(match.totalDuration)}
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="sets" className="w-full">
          <TabsList className="flex w-full mb-4 sm:mb-6 overflow-x-auto gap-1">
            <TabsTrigger value="sets" className="flex-1 min-w-0 px-2 sm:px-3 text-xs sm:text-sm shrink-0">Sets</TabsTrigger>
            <TabsTrigger value="statistics" className="flex-1 min-w-0 px-2 sm:px-3 text-xs sm:text-sm shrink-0">Estatísticas</TabsTrigger>
            <TabsTrigger value="transitions" className="flex-1 min-w-0 px-2 sm:px-3 text-xs sm:text-sm shrink-0">Transições</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-0 px-2 sm:px-3 text-xs sm:text-sm shrink-0">AA</TabsTrigger>
            <TabsTrigger value="charts" className="flex-1 min-w-0 px-2 sm:px-3 text-xs sm:text-sm shrink-0">Gráficos</TabsTrigger>
          </TabsList>

          {/* Sets Tab */}
          <TabsContent value="sets">
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Sets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {match.sets.map((set, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSet(idx)}
                    className={`p-3 sm:p-4 rounded-lg transition-all ${
                      selectedSet === idx
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-medium">Set {idx + 1}</div>
                    <div className="text-xl sm:text-2xl font-bold mt-2">
                      {set.teamAScore} x {set.teamBScore}
                    </div>
                    <div className="text-xs mt-1 opacity-75 truncate">
                      Vencedor: {set.teamAScore > set.teamBScore ? match.teamAName : match.teamBName}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selectedSetData && (
              <>
                <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                    Detalhes do Set {selectedSet + 1}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">{match.teamAName}</p>
                      <p className="text-3xl font-bold text-foreground">{selectedSetData.teamAScore}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-right">
                      <p className="text-sm text-muted-foreground mb-2">{match.teamBName}</p>
                      <p className="text-3xl font-bold text-foreground">{selectedSetData.teamBScore}</p>
                    </div>
                  </div>
                </Card>

                <SetProgressionVisualization
                  actions={setActions}
                  teamAName={match.teamAName}
                  teamBName={match.teamBName}
                  setNumber={selectedSet + 1}
                />
              </>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            {teamStats && (
              <ModernStatsDashboard
                stats={{ statsA: teamStats.statsA, statsB: teamStats.statsB }}
                teamAName={match.teamAName}
                teamBName={match.teamBName}
                actions={match.actions}
                sets={match.sets}
              />
            )}
          </TabsContent>

          {/* Transitions Tab */}
          <TabsContent value="transitions">
            <TransitionsDashboard
              actions={match.actions}
              teamAName={match.teamAName}
              teamBName={match.teamBName}
            />
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics">
            {teamStats && (
              <AdvancedAnalyticsDashboard
                teamA={teamStats.teamA}
                teamB={teamStats.teamB}
              />
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            <AdvancedAnalyticsCharts
              actions={match.actions}
              teamAName={match.teamAName}
              teamBName={match.teamBName}
              sets={match.sets}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
