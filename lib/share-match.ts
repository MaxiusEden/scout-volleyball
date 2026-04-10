/**
 * Sistema de compartilhamento de partidas
 */

import { getMatchById, type StoredMatch } from './match-storage'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { generatePDF } from './export-utils'

/**
 * Compartilha uma partida como arquivo JSON
 */
export async function shareMatchAsFile(matchId: string): Promise<void> {
  const match = getMatchById(matchId)
  if (!match) {
    throw new Error('Partida não encontrada')
  }

  const jsonString = JSON.stringify(match, null, 2)
  const filename = `partida_${match.teamAName}_vs_${match.teamBName}_${Date.now()}.json`

  if (Capacitor.isNativePlatform()) {
    // Salvar e compartilhar no dispositivo
    const base64 = btoa(unescape(encodeURIComponent(jsonString)))
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })

    const fileUri = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    })

    await Share.share({
      title: `Partida: ${match.teamAName} vs ${match.teamBName}`,
      text: `Partida de voleibol - ${match.teamAName} vs ${match.teamBName}`,
      url: fileUri.uri,
      dialogTitle: 'Compartilhar partida',
    })
  } else {
    // No navegador, usar Web Share API ou download
    if (navigator.share) {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], filename, { type: 'application/json' })
      await navigator.share({
        title: `Partida: ${match.teamAName} vs ${match.teamBName}`,
        text: `Partida de voleibol - ${match.teamAName} vs ${match.teamBName}`,
        files: [file],
      })
    } else {
      // Fallback: download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}

/**
 * Compartilha uma partida como PDF
 */
export async function shareMatchAsPDF(matchId: string): Promise<void> {
  const match = getMatchById(matchId)
  if (!match) {
    throw new Error('Partida não encontrada')
  }

  // Importar dinamicamente para evitar dependência circular
  const { calculateMatchStats } = await import('./match-parser')
  const stats = calculateMatchStats(match.actions)

  // Gerar PDF
  await generatePDF(
    {
      teamAName: match.teamAName,
      teamBName: match.teamBName,
      category: match.category,
      startTime: match.createdAt,
      winner: match.winner,
    },
    stats,
    match.sets,
    'BOTH'
  )
}

/**
 * Gera um link compartilhável (base64 do JSON)
 */
export function generateShareableLink(matchId: string): string {
  if (typeof window === 'undefined') {
    throw new Error('generateShareableLink can only be used on the client side')
  }
  
  const match = getMatchById(matchId)
  if (!match) {
    throw new Error('Partida não encontrada')
  }

  const jsonString = JSON.stringify(match)
  const base64 = btoa(unescape(encodeURIComponent(jsonString)))
  const shareUrl = `${window.location.origin}/share/${base64}`
  
  return shareUrl
}

/**
 * Importa partida de um link compartilhável
 */
export function importFromShareableLink(base64: string): StoredMatch {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64)))
    const match: StoredMatch = JSON.parse(jsonString)
    
    // Validar estrutura
    if (!match.id || !match.teamAName || !match.teamBName) {
      throw new Error('Formato de partida inválido')
    }

    return match
  } catch (error) {
    throw new Error(`Erro ao importar partida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

