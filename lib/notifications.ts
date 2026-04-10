/**
 * Sistema de notificações nativas
 */

import { Capacitor } from '@capacitor/core'

export interface NotificationOptions {
  title: string
  body: string
  id?: number
  data?: any
}

/**
 * Envia notificação (nativa no mobile, toast no web)
 */
export async function sendNotification(options: NotificationOptions): Promise<void> {
  if (typeof window === 'undefined') return
  
  if (Capacitor.isNativePlatform()) {
    // No futuro, usar @capacitor/local-notifications
    // Por enquanto, usar alert nativo
    if (window.alert) {
      window.alert(`${options.title}\n\n${options.body}`)
    }
  } else {
    // No navegador, usar Notifications API se disponível
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: options.data,
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      // Solicitar permissão
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          data: options.data,
        })
      }
    }
  }
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Notificações pré-definidas
 */
export const Notifications = {
  matchSaved: (teamAName: string, teamBName: string) =>
    sendNotification({
      title: 'Partida salva',
      body: `${teamAName} vs ${teamBName} foi salva com sucesso!`,
    }),

  syncSuccess: () =>
    sendNotification({
      title: 'Sincronização concluída',
      body: 'Todas as partidas foram sincronizadas com a nuvem.',
    }),

  syncError: (error: string) =>
    sendNotification({
      title: 'Erro de sincronização',
      body: `Não foi possível sincronizar: ${error}`,
    }),

  backupExported: (count: number) =>
    sendNotification({
      title: 'Backup exportado',
      body: `${count} partida${count > 1 ? 's' : ''} exportada${count > 1 ? 's' : ''} com sucesso!`,
    }),

  backupImported: (count: number) =>
    sendNotification({
      title: 'Backup importado',
      body: `${count} partida${count > 1 ? 's' : ''} importada${count > 1 ? 's' : ''} com sucesso!`,
    }),

  matchShared: () =>
    sendNotification({
      title: 'Partida compartilhada',
      body: 'A partida foi compartilhada com sucesso!',
    }),
}

