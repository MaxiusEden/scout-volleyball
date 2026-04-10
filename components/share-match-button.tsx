"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, FileText, Link as LinkIcon, Copy, Check } from "lucide-react"
import { shareMatchAsFile, shareMatchAsPDF, generateShareableLink } from "@/lib/share-match"
import { useToast } from "@/hooks/use-toast"
import { Notifications } from "@/lib/notifications"

interface ShareMatchButtonProps {
  matchId: string
  matchName: string
}

export default function ShareMatchButton({ matchId, matchName }: ShareMatchButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleShareFile = async () => {
    try {
      await shareMatchAsFile(matchId)
      await Notifications.matchShared()
      toast({
        title: "Partida compartilhada",
        description: "A partida foi compartilhada como arquivo.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao compartilhar",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSharePDF = async () => {
    try {
      await shareMatchAsPDF(matchId)
      await Notifications.matchShared()
      toast({
        title: "PDF compartilhado",
        description: "A partida foi compartilhada como PDF.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao compartilhar PDF",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      const link = generateShareableLink(matchId)
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao copiar link",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Compartilhar partida">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShareFile}>
          <FileText className="w-4 h-4 mr-2" />
          Compartilhar como arquivo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSharePDF}>
          <FileText className="w-4 h-4 mr-2" />
          Compartilhar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Link copiado!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copiar link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

