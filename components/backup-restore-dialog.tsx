"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { exportBackup, saveBackupFile, importBackup, readBackupFile } from "@/lib/backup-restore"
import { Download, Upload, Copy, Check } from "lucide-react"

export default function BackupRestoreDialog() {
  const [open, setOpen] = useState(false)
  const [jsonText, setJsonText] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      const json = await exportBackup()
      setJsonText(json)
      toast({
        title: "Backup gerado",
        description: "O backup foi gerado com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao gerar backup",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveFile = async () => {
    try {
      await saveBackupFile()
      toast({
        title: "Backup salvo",
        description: "O arquivo foi salvo com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar backup",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copiado",
        description: "Backup copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o backup.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    try {
      if (!jsonText.trim()) {
        toast({
          title: "Erro",
          description: "Cole o JSON do backup antes de importar.",
          variant: "destructive",
        })
        return
      }

      const result = await importBackup(jsonText)
      
      if (result.success) {
        toast({
          title: "Backup importado",
          description: `${result.imported} partida${result.imported > 1 ? 's' : ''} importada${result.imported > 1 ? 's' : ''} com sucesso.`,
        })
        setOpen(false)
        setJsonText("")
        // Recarregar página para atualizar dados
        window.location.reload()
      } else {
        toast({
          title: "Importação parcial",
          description: `${result.imported} partida${result.imported > 1 ? 's' : ''} importada${result.imported > 1 ? 's' : ''}, ${result.errors.length} erro${result.errors.length > 1 ? 's' : ''}.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLoadFile = async () => {
    try {
      const content = await readBackupFile()
      setJsonText(content)
      toast({
        title: "Arquivo carregado",
        description: "O backup foi carregado com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao carregar arquivo",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Backup/Restore</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Backup e Restore de Dados</DialogTitle>
          <DialogDescription>
            Exporte todas as suas partidas para backup ou importe de um backup anterior.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="font-semibold">Exportar Backup</h3>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" size="sm">
                Gerar JSON
              </Button>
              <Button onClick={handleSaveFile} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Salvar Arquivo
              </Button>
            </div>
          </div>

          {/* JSON Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">JSON do Backup</label>
              {jsonText && (
                <Button onClick={handleCopy} variant="ghost" size="sm">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              )}
            </div>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Cole aqui o JSON do backup ou gere um novo..."
              className="min-h-[200px] font-mono text-xs"
            />
          </div>

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="font-semibold">Importar Backup</h3>
            <div className="flex gap-2">
              <Button onClick={handleLoadFile} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Carregar Arquivo
              </Button>
              <Button onClick={handleImport} variant="default" size="sm" disabled={!jsonText.trim()}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
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

