/**
 * Sistema de exportação em lote
 */

import { type StoredMatch } from './match-storage'
import { generatePDF } from './export-utils'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import * as XLSX from 'xlsx'

/**
 * Exporta múltiplas partidas como PDFs
 */
export async function exportMatchesAsPDFs(matches: StoredMatch[]): Promise<void> {
  if (matches.length === 0) {
    throw new Error('Nenhuma partida selecionada')
  }

  // Importar dinamicamente
  const { calculateMatchStats } = await import('./match-parser')

  for (const match of matches) {
    const stats = calculateMatchStats(match.actions)
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
    
    // Pequeno delay entre exportações
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

/**
 * Exporta múltiplas partidas como um único arquivo Excel
 */
export async function exportMatchesAsExcel(matches: StoredMatch[]): Promise<void> {
  if (matches.length === 0) {
    throw new Error('Nenhuma partida selecionada')
  }

  const wb = XLSX.utils.book_new()

  // Aba de resumo
  const summaryData = matches.map((match) => ({
    'Time A': match.teamAName,
    'Time B': match.teamBName,
    'Categoria': match.category,
    'Vencedor': match.winner === 'A' ? match.teamAName : match.teamBName,
    'Sets': match.sets.map((s) => `${s.teamAScore}x${s.teamBScore}`).join(' | '),
    'Data': new Date(match.completedAt).toLocaleDateString('pt-BR'),
    'Duração': `${Math.floor(match.totalDuration / 60)}min`,
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo')

  // Aba para cada partida
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const { calculateTeamStats } = await import('./match-parser')
    
    const statsA = calculateTeamStats(match.actions, 'A')
    const statsB = calculateTeamStats(match.actions, 'B')

    const matchData = [
      ['Time A', match.teamAName, 'Time B', match.teamBName],
      ['Categoria', match.category, 'Vencedor', match.winner === 'A' ? match.teamAName : match.teamBName],
      [],
      ['Estatísticas - Time A'],
      ['Saque Correto', statsA.serves.correct, 'Saque Erro', statsA.serves.errors, 'Aces', statsA.serves.aces],
      ['Recepção A', statsA.reception.qualityA, 'Recepção B', statsA.reception.qualityB, 'Recepção C', statsA.reception.qualityC],
      ['Ataque Ponto', statsA.attacks.successful, 'Ataque Erro', statsA.attacks.errors, 'Bloqueado', statsA.attacks.blocked],
      ['Pontos', statsA.points],
      [],
      ['Estatísticas - Time B'],
      ['Saque Correto', statsB.serves.correct, 'Saque Erro', statsB.serves.errors, 'Aces', statsB.serves.aces],
      ['Recepção A', statsB.reception.qualityA, 'Recepção B', statsB.reception.qualityB, 'Recepção C', statsB.reception.qualityC],
      ['Ataque Ponto', statsB.attacks.successful, 'Ataque Erro', statsB.attacks.errors, 'Bloqueado', statsB.attacks.blocked],
      ['Pontos', statsB.points],
    ]

    const matchSheet = XLSX.utils.aoa_to_sheet(matchData)
    const sheetName = `Partida ${i + 1}`.substring(0, 31) // Limite de 31 caracteres
    XLSX.utils.book_append_sheet(wb, matchSheet, sheetName)
  }

  // Salvar arquivo
  const filename = `Partidas_Em_Lote_${Date.now()}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })

  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: filename,
      data: wbout,
      directory: Directory.Documents,
      recursive: true,
    })

    const fileUri = await Filesystem.getUri({
      path: filename,
      directory: Directory.Documents,
    })

    await Share.share({
      title: 'Partidas em lote',
      text: `${matches.length} partida${matches.length > 1 ? 's' : ''} exportada${matches.length > 1 ? 's' : ''}`,
      url: fileUri.uri,
      dialogTitle: 'Compartilhar arquivo',
    })
  } else {
    // Download no navegador
    const blob = new Blob([Uint8Array.from(atob(wbout), (c) => c.charCodeAt(0))], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
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

/**
 * Exporta múltiplas partidas como JSON
 */
export async function exportMatchesAsJSON(matches: StoredMatch[]): Promise<void> {
  if (matches.length === 0) {
    throw new Error('Nenhuma partida selecionada')
  }

  const jsonString = JSON.stringify(matches, null, 2)
  const filename = `partidas_em_lote_${Date.now()}.json`

  if (Capacitor.isNativePlatform()) {
    const base64 = btoa(unescape(encodeURIComponent(jsonString)))
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    })

    const fileUri = await Filesystem.getUri({
      path: filename,
      directory: Directory.Documents,
    })

    await Share.share({
      title: 'Partidas em lote',
      text: `${matches.length} partida${matches.length > 1 ? 's' : ''} exportada${matches.length > 1 ? 's' : ''}`,
      url: fileUri.uri,
      dialogTitle: 'Compartilhar arquivo',
    })
  } else {
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

