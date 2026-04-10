"use client"

import { useState } from "react"
import { type StoredMatch, getMatches } from "@/lib/match-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { exportMatchesAsPDFs, exportMatchesAsExcel, exportMatchesAsJSON } from "@/lib/batch-export"
import { Notifications } from "@/lib/notifications"
import { Download, FileText, Table, FileJson } from "lucide-react"

export default function BatchExportDialog() {
  const [open, setOpen] = useState(false)
  const [matches] = useState<StoredMatch[]>(getMatches())
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const toggleMatch = (matchId: string) => {
    const newSelected = new Set(selectedMatches)
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId)
    } else {
      newSelected.add(matchId)
    }
    setSelectedMatches(newSelected)
  }

  const selectAll = () => {
    if (selectedMatches.size === matches.length) {
      setSelectedMatches(new Set())
    } else {
      setSelectedMatches(new Set(matches.map((m) => m.id)))
    }
  }

  const handleExportPDFs = async () => {
    if (selectedMatches.size === 0) {
      toast({
        title: "Nenhuma partida selecionada",
        description: "Selecione pelo menos uma partida para exportar.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const selected = matches.filter((m) => selectedMatches.has(m.id))
      await exportMatchesAsPDFs(selected)
      await Notifications.backupExported(selected.length)
      toast({
        title: "Exportação concluída",
        description: `${selected.length} PDF${selected.length > 1 ? 's' : ''} gerado${selected.length > 1 ? 's' : ''} com sucesso.`,
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (selectedMatches.size === 0) {
      toast({
        title: "Nenhuma partida selecionada",
        description: "Selecione pelo menos uma partida para exportar.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const selected = matches.filter((m) => selectedMatches.has(m.id))
      await exportMatchesAsExcel(selected)
      await Notifications.backupExported(selected.length)
      toast({
        title: "Exportação concluída",
        description: `Arquivo Excel com ${selected.length} partida${selected.length > 1 ? 's' : ''} gerado com sucesso.`,
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    if (selectedMatches.size === 0) {
      toast({
        title: "Nenhuma partida selecionada",
        description: "Selecione pelo menos uma partida para exportar.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const selected = matches.filter((m) => selectedMatches.has(m.id))
      await exportMatchesAsJSON(selected)
      await Notifications.backupExported(selected.length)
      toast({
        title: "Exportação concluída",
        description: `Arquivo JSON com ${selected.length} partida${selected.length > 1 ? 's' : ''} gerado com sucesso.`,
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportação em Lote</DialogTitle>
          <DialogDescription>
            Selecione as partidas que deseja exportar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedMatches.size === matches.length ? "Desselecionar todas" : "Selecionar todas"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedMatches.size} de {matches.length} selecionada{selectedMatches.size !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted"
              >
                <Checkbox
                  id={match.id}
                  checked={selectedMatches.has(match.id)}
                  onCheckedChange={() => toggleMatch(match.id)}
                />
                <label
                  htmlFor={match.id}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <div className="font-medium">
                    {match.teamAName} vs {match.teamBName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(match.completedAt).toLocaleDateString('pt-BR')} • {match.category}
                  </div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleExportPDFs}
              disabled={selectedMatches.size === 0 || isExporting}
              variant="outline"
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDFs
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={selectedMatches.size === 0 || isExporting}
              variant="outline"
              className="flex-1"
            >
              <Table className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={handleExportJSON}
              disabled={selectedMatches.size === 0 || isExporting}
              variant="outline"
              className="flex-1"
            >
              <FileJson className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

