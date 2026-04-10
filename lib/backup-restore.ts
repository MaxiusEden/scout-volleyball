/**
 * Sistema de Backup e Restore de dados
 */

import { getMatches, type StoredMatch } from './match-storage'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import { Notifications } from './notifications'

export interface BackupData {
  version: string
  exportDate: string
  matches: StoredMatch[]
  metadata: {
    totalMatches: number
    totalSets: number
  }
}

/**
 * Exporta todas as partidas para JSON
 */
export async function exportBackup(): Promise<string> {
  const matches = getMatches()
  const totalSets = matches.reduce((sum, m) => sum + m.sets.length, 0)

  const backup: BackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    matches,
    metadata: {
      totalMatches: matches.length,
      totalSets,
    },
  }

  const jsonString = JSON.stringify(backup, null, 2)
  return jsonString
}

/**
 * Salva backup como arquivo
 */
export async function saveBackupFile(): Promise<void> {
  try {
    const jsonString = await exportBackup()
    const filename = `scout_backup_${Date.now()}.json`

    if (Capacitor.isNativePlatform()) {
      // Salvar no dispositivo
      const base64 = btoa(unescape(encodeURIComponent(jsonString)))
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      })

      // Compartilhar arquivo
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Documents,
      })

      await Share.share({
        title: 'Backup Scout Volleyball',
        text: 'Backup das partidas',
        url: fileUri.uri,
        dialogTitle: 'Compartilhar backup',
      })
    } else {
      // Download no navegador
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
  } catch (error) {
    console.error('[BACKUP] Error saving backup:', error)
    throw error
  }
}

/**
 * Importa backup de JSON
 */
export async function importBackup(jsonString: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = []
  let imported = 0

  try {
    const backup: BackupData = JSON.parse(jsonString)

    // Validar estrutura
    if (!backup.matches || !Array.isArray(backup.matches)) {
      throw new Error('Formato de backup inválido: matches não encontrado')
    }

    // Validar versão (para compatibilidade futura)
    if (!backup.version) {
      console.warn('[BACKUP] Backup sem versão, assumindo v1.0.0')
    }

    // Importar partidas
    const existingMatches = getMatches()
    const existingIds = new Set(existingMatches.map((m) => m.id))

    for (const match of backup.matches) {
      try {
        // Validar estrutura da partida
        if (!match.id || !match.teamAName || !match.teamBName) {
          errors.push(`Partida inválida: ${match.id || 'sem ID'}`)
          continue
        }

        // Se já existe, pular ou atualizar (escolha: pular para evitar duplicatas)
        if (existingIds.has(match.id)) {
          console.log(`[BACKUP] Partida ${match.id} já existe, pulando...`)
          continue
        }

        // Adicionar à lista existente
        existingMatches.push(match)
        imported++
      } catch (error: any) {
        errors.push(`Erro ao importar partida ${match.id}: ${error.message}`)
      }
    }

      // Salvar todas as partidas
      if (imported > 0) {
        localStorage.setItem('scout_matches', JSON.stringify(existingMatches))
        await Notifications.backupImported(imported)
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
      }
  } catch (error: any) {
    console.error('[BACKUP] Error importing backup:', error)
    throw new Error(`Erro ao importar backup: ${error.message}`)
  }
}

/**
 * Lê arquivo de backup (para importação)
 */
export async function readBackupFile(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    // No futuro, usar FilePicker do Capacitor
    throw new Error('Importação de arquivo ainda não implementada para mobile. Use a opção de colar JSON.')
  } else {
    // No navegador, usar input file
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          reject(new Error('Nenhum arquivo selecionado'))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          resolve(content)
        }
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsText(file)
      }
      input.click()
    })
  }
}

