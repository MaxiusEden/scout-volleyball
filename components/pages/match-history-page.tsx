"use client"

import { useState, useEffect } from "react"
import { type StoredMatch, getMatches, deleteMatch, getMatchStatistics } from "@/lib/match-storage"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import MatchDetailsPage from "./match-details-page"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { buttonVariants } from "@/components/ui/button"
import BackupRestoreDialog from "@/components/backup-restore-dialog"
import SyncStatusIndicator from "@/components/sync-status-indicator"
import BatchExportDialog from "@/components/batch-export-dialog"
import { syncMatchesFromCloud, deleteMatchFromCloud } from "@/lib/actions"
import { Notifications } from "@/lib/notifications"
import { ThemeToggle } from "@/components/theme-toggle"
import { SubscriptionGuard } from "@/components/subscription-guard"

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<StoredMatch[]>([])
  const [stats, setStats] = useState({ totalMatches: 0, totalGames: 0, averageSetsPerMatch: "0" })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [matchToDelete, setMatchToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadMatches()
    // Sincronizar com a nuvem ao montar o componente
    syncWithCloud()
  }, [])

  const loadMatches = () => {
    const allMatches = getMatches()
    setMatches(allMatches)
    setStats(getMatchStatistics(allMatches))
  }

  const syncWithCloud = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    try {
      console.log('[SYNC] Iniciando sincronização automática...')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:45',message:'starting auto sync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
      // #endregion
      
      const result = await syncMatchesFromCloud()
      
      if (result.synced > 0 || result.uploaded > 0) {
        loadMatches() // Recarregar partidas após sincronização
        await Notifications.syncSuccess()
        const messages = []
        if (result.synced > 0) {
          messages.push(`${result.synced} baixada${result.synced > 1 ? 's' : ''}`)
        }
        if (result.uploaded > 0) {
          messages.push(`${result.uploaded} enviada${result.uploaded > 1 ? 's' : ''}`)
        }
        toast({
          title: "Sincronização concluída",
          description: messages.join(', ') + ' da nuvem.',
          variant: "default",
        })
      } else if (result.errors.length > 0) {
        toast({
          title: "Erro na sincronização",
          description: result.errors[0],
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[SYNC] Erro na sincronização automática:', error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:63',message:'auto sync error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
      // #endregion
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredMatches = selectedCategory ? matches.filter((m) => m.category === selectedCategory) : matches

  const handleDeleteClick = (match: StoredMatch, e: React.MouseEvent) => {
    e.stopPropagation()
    setMatchToDelete({ 
      id: match.id, 
      name: `${match.teamAName} vs ${match.teamBName}` 
    })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!matchToDelete) return
    
    try {
      console.log('[DELETE] Iniciando deleção da partida:', matchToDelete.id)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:104',message:'starting match deletion',data:{matchId:matchToDelete.id,matchName:matchToDelete.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      // #endregion

      // Deletar localmente primeiro
      deleteMatch(matchToDelete.id)
      
      // Tentar deletar da nuvem também
      const cloudResult = await deleteMatchFromCloud(matchToDelete.id)
      if (!cloudResult.success && cloudResult.error) {
        console.warn('[DELETE] Erro ao deletar da nuvem, mas partida foi deletada localmente:', cloudResult.error)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:115',message:'cloud delete failed but local delete succeeded',data:{matchId:matchToDelete.id,error:cloudResult.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
        // #endregion
      }

      const updated = getMatches()
      setMatches(updated)
      setStats(getMatchStatistics(updated))
      
      toast({
        title: "Partida deletada",
        description: `"${matchToDelete.name}" foi removida com sucesso${cloudResult.success ? ' da nuvem e' : ''} localmente.`,
        variant: "default",
      })
      
      console.log('[DELETE] Partida deletada com sucesso:', matchToDelete.id)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:128',message:'match deleted successfully',data:{matchId:matchToDelete.id,cloudDeleted:cloudResult.success},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      console.error("[ERROR] Failed to delete match:", error)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'match-history-page.tsx:133',message:'match deletion failed',data:{matchId:matchToDelete.id,error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      // #endregion
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a partida. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMatchToDelete(null)
    }
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

  if (selectedMatchId) {
    return <MatchDetailsPage matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />
  }

  return (
    <SubscriptionGuard>
      <div className="w-full min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Histórico de Partidas</h1>
          <div className="flex gap-2 flex-wrap items-center">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={syncWithCloud} 
              disabled={isSyncing}
              aria-label="Sincronizar com a nuvem"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
            <BatchExportDialog />
            <BackupRestoreDialog />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total de Partidas</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalMatches}</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total de Sets</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalGames}</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Média de Sets</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.averageSetsPerMatch}</p>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-6 flex gap-2 flex-wrap">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            onClick={() => setSelectedCategory(null)}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Todas
          </Button>
          {["sub13", "sub15", "sub17", "sub19", "sub21", "adult"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="capitalize text-xs sm:text-sm"
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-3 sm:space-y-4 pb-4">
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <Card 
                key={match.id} 
                className="p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setSelectedMatchId(match.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedMatchId(match.id)
                  }
                }}
                aria-label={`Partida ${match.teamAName} vs ${match.teamBName}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {match.teamAName} vs {match.teamBName}
                      </h3>
                      <Badge 
                        variant={match.winner === "A" ? "default" : "secondary"} 
                        aria-label={`Vencedor: ${match.winner === "A" ? match.teamAName : match.teamBName}`}
                        className="text-xs"
                      >
                        Vencedor: {match.winner === "A" ? match.teamAName : match.teamBName}
                      </Badge>
                      <Badge variant="outline" aria-label={`Categoria: ${match.category}`} className="text-xs">{match.category}</Badge>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                      <p className="truncate">Sets: {match.sets.map((s) => `${s.teamAScore}x${s.teamBScore}`).join(" | ")}</p>
                      <p>Realizado em {formatDate(match.completedAt)}</p>
                      <p>Duração: {formatDuration(match.totalDuration)}</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={(e) => handleDeleteClick(match, e)}
                    aria-label={`Deletar partida ${match.teamAName} vs ${match.teamBName}`}
                    className="w-full sm:w-auto shrink-0"
                  >
                    Deletar
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">Nenhuma partida encontrada</p>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a partida <strong>"{matchToDelete?.name}"</strong>?
              Esta ação não pode ser desfeita e todos os dados da partida serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={buttonVariants({ variant: "destructive" })}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SyncStatusIndicator />
      </div>
    </SubscriptionGuard>
  )
}
