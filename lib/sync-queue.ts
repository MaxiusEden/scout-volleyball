/**
 * Sistema de fila de sincronização com retry automático
 */

interface SyncQueueItem {
  id: string
  type: 'match' | 'action'
  data: any
  retries: number
  timestamp: number
  status: 'pending' | 'processing' | 'failed' | 'completed'
}

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 segundos
const QUEUE_STORAGE_KEY = 'scout_sync_queue'
const SYNC_STATUS_KEY = 'scout_sync_status'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  queueLength: number
  lastSyncTime: number | null
  failedItems: number
}

class SyncQueue {
  private queue: SyncQueueItem[] = []
  private isProcessing = false
  private syncStatus: SyncStatus = {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    queueLength: 0,
    lastSyncTime: null,
    failedItems: 0,
  }
  private listeners: Array<(status: SyncStatus) => void> = []

  constructor() {
    // Só inicializar no cliente
    if (typeof window === 'undefined') {
      return
    }
    
    this.loadQueue()
    this.loadStatus()
    this.setupOnlineListener()
    this.startProcessing()
  }

  private setupOnlineListener() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true
      this.notifyListeners()
      this.startProcessing()
    })

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false
      this.notifyListeners()
    })
  }

  private loadQueue() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
        this.updateStatus()
      }
    } catch (error) {
      console.error('[SYNC QUEUE] Error loading queue:', error)
      this.queue = []
    }
  }

  private saveQueue() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue))
      this.updateStatus()
    } catch (error) {
      console.error('[SYNC QUEUE] Error saving queue:', error)
    }
  }

  private loadStatus() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    
    try {
      const stored = localStorage.getItem(SYNC_STATUS_KEY)
      if (stored) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('[SYNC QUEUE] Error loading status:', error)
    }
  }

  private saveStatus() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(this.syncStatus))
    } catch (error) {
      console.error('[SYNC QUEUE] Error saving status:', error)
    }
  }

  private updateStatus() {
    this.syncStatus.queueLength = this.queue.filter((q) => q.status === 'pending' || q.status === 'failed').length
    this.syncStatus.failedItems = this.queue.filter((q) => q.status === 'failed').length
    this.saveStatus()
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.syncStatus }))
  }

  public onStatusChange(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  public getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  public async enqueue(type: 'match' | 'action', data: any): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('SyncQueue can only be used on the client side')
    }
    
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      retries: 0,
      timestamp: Date.now(),
      status: 'pending',
    }

    this.queue.push(item)
    this.saveQueue()
    this.startProcessing()

    return item.id
  }

  private async processItem(item: SyncQueueItem): Promise<boolean> {
    try {
      item.status = 'processing'
      this.saveQueue()

      // Importar dinamicamente para evitar dependência circular
      const { saveMatch } = await import('./actions')
      
      if (item.type === 'match') {
        const result = await saveMatch(item.data)
        if (result.success) {
          item.status = 'completed'
          this.syncStatus.lastSyncTime = Date.now()
          return true
        } else {
          throw new Error(result.error || 'Unknown error')
        }
      }

      return false
    } catch (error) {
      console.error(`[SYNC QUEUE] Error processing item ${item.id}:`, error)
      item.retries++
      
      if (item.retries >= MAX_RETRIES) {
        item.status = 'failed'
      } else {
        item.status = 'pending'
      }
      
      this.saveQueue()
      return false
    }
  }

  private async startProcessing() {
    if (this.isProcessing || !this.syncStatus.isOnline) return

    this.isProcessing = true
    this.syncStatus.isSyncing = true
    this.notifyListeners()

    while (this.queue.length > 0 && this.syncStatus.isOnline) {
      const pendingItems = this.queue.filter(
        (item) => item.status === 'pending' || (item.status === 'failed' && item.retries < MAX_RETRIES)
      )

      if (pendingItems.length === 0) break

      for (const item of pendingItems) {
        if (!this.syncStatus.isOnline) break

        const success = await this.processItem(item)
        
        if (!success && item.retries < MAX_RETRIES) {
          // Aguardar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        }
      }

      // Remover itens completados
      this.queue = this.queue.filter((item) => item.status !== 'completed')
      this.saveQueue()
    }

    this.isProcessing = false
    this.syncStatus.isSyncing = false
    this.updateStatus()
  }

  public clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== 'completed')
    this.saveQueue()
  }

  public clearFailed() {
    this.queue = this.queue.filter((item) => item.status !== 'failed')
    this.saveQueue()
  }

  public retryFailed() {
    this.queue.forEach((item) => {
      if (item.status === 'failed') {
        item.status = 'pending'
        item.retries = 0
      }
    })
    this.saveQueue()
    this.startProcessing()
  }
}

// Instanciar apenas no cliente
export const syncQueue = typeof window !== 'undefined' ? new SyncQueue() : {
  getStatus: () => ({ isOnline: true, isSyncing: false, queueLength: 0, lastSyncTime: null, failedItems: 0 }),
  onStatusChange: () => () => {},
  enqueue: async () => { throw new Error('SyncQueue can only be used on the client side') },
  clearCompleted: () => {},
  clearFailed: () => {},
  retryFailed: () => {},
} as any

