import { supabase } from './supabase'
import { syncQueue } from './sync-queue'
import { type StoredMatch, saveMatch as saveLocalMatch } from './match-storage'
import { hasAccess } from './subscription'

/**
 * Busca todas as partidas do usuário no Supabase
 */
export async function fetchMatchesFromCloud(): Promise<StoredMatch[]> {
  try {
    // VERIFICAÇÃO: bloquear acesso se o usuário não tiver assinatura
    const userHasAccess = await hasAccess()
    if (!userHasAccess) {
      console.warn('[SYNC] Acesso bloqueado: assinatura necessária para visualizar partidas na nuvem')
      return []
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[SYNC] Usuário não autenticado, não é possível buscar partidas')
      return []
    }

    console.log('[SYNC] Buscando partidas do Supabase para usuário:', user.id)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:15',message:'fetching matches from cloud',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SYNC] Erro ao buscar partidas:', error)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:25',message:'error fetching matches',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
      }
      // #endregion
      throw error
    }

    if (!data || data.length === 0) {
      console.log('[SYNC] Nenhuma partida encontrada no Supabase')
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:33',message:'no matches found in cloud',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
      }
      // #endregion
      return []
    }

    console.log(`[SYNC] ${data.length} partida(s) encontrada(s) no Supabase`)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:40',message:'matches found in cloud',data:{count:data.length,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    // Converter dados do Supabase para formato StoredMatch
    const matches: StoredMatch[] = data.map((item: any) => {
      const matchData = item.data || {}
      
      // Converter datas corretamente
      let createdAt: Date
      let completedAt: Date
      
      try {
        createdAt = matchData.createdAt 
          ? (matchData.createdAt instanceof Date ? matchData.createdAt : new Date(matchData.createdAt))
          : (item.created_at ? new Date(item.created_at) : new Date())
      } catch {
        createdAt = new Date()
      }
      
      try {
        completedAt = matchData.completedAt
          ? (matchData.completedAt instanceof Date ? matchData.completedAt : new Date(matchData.completedAt))
          : (item.updated_at ? new Date(item.updated_at) : new Date())
      } catch {
        completedAt = new Date()
      }
      
      // Usar ID do Supabase se disponível, senão usar ID do matchData, senão gerar
      const matchId = item.id || matchData.id || `cloud_${item.created_at || Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        id: matchId,
        teamAName: matchData.teamAName || 'Time A',
        teamBName: matchData.teamBName || 'Time B',
        category: matchData.category || 'adult',
        sets: matchData.sets || [],
        actions: matchData.actions || [],
        totalDuration: matchData.totalDuration || 0,
        createdAt,
        completedAt,
        winner: matchData.winner || 'A',
      }
    })

    console.log('[SYNC] Partidas convertidas:', matches.length)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:58',message:'matches converted',data:{count:matches.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    return matches
  } catch (error: any) {
    console.error('[SYNC] Erro ao buscar partidas do Supabase:', error)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:66',message:'error in fetchMatchesFromCloud',data:{error:error.message,errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion
    return []
  }
}

/**
 * Gera um hash único para uma partida baseado em seus dados
 */
function generateMatchHash(match: any): string {
  const key = `${match.teamAName}_${match.teamBName}_${match.createdAt}_${match.sets.length}_${match.actions.length}`
  // Hash simples baseado em string
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`
}

/**
 * Sincroniza partidas bidirecionalmente (nuvem <-> local)
 */
export async function syncMatchesFromCloud(): Promise<{ synced: number; uploaded: number; errors: string[] }> {
  const errors: string[] = []
  let synced = 0
  let uploaded = 0

  try {
    // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de sincronizar
    const userHasAccess = await hasAccess()
    if (!userHasAccess) {
      const errorMsg = 'Assinatura necessária para sincronizar dados. Faça uma assinatura para usar esta funcionalidade.'
      console.warn('[SYNC] Acesso bloqueado:', errorMsg)
      return { synced: 0, uploaded: 0, errors: [errorMsg] }
    }

    // Verificar se está online rapidamente
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    if (!isOnline) {
      console.log('[SYNC] Offline - apenas mostrando partidas locais')
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:130',message:'offline detected',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'OFFLINE'})}).catch(()=>{});
      }
      // #endregion
      return { synced: 0, uploaded: 0, errors: [] }
    }

    console.log('[SYNC] Iniciando sincronização bidirecional...')
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:140',message:'starting bidirectional sync',data:{isOnline},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    // Buscar partidas locais e da nuvem
    const { getMatches } = await import('./match-storage')
    const localMatches = getMatches()
    const cloudMatches = await fetchMatchesFromCloud()

    // Criar mapas de hashes para comparação (evita duplicatas)
    const localHashes = new Map<string, StoredMatch>()
    const cloudHashes = new Map<string, StoredMatch>()
    const localIds = new Set(localMatches.map((m) => m.id))
    const cloudIds = new Set(cloudMatches.map((m) => m.id))

    // Indexar partidas locais por hash e ID
    for (const match of localMatches) {
      const hash = generateMatchHash(match)
      localHashes.set(hash, match)
    }

    // Indexar partidas da nuvem por hash e ID
    for (const match of cloudMatches) {
      const hash = generateMatchHash(match)
      cloudHashes.set(hash, match)
    }

    console.log(`[SYNC] ${localMatches.length} partida(s) local(is), ${cloudMatches.length} partida(s) na nuvem`)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:165',message:'comparing local and cloud',data:{localCount:localMatches.length,cloudCount:cloudMatches.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    // 1. Baixar partidas da nuvem que não existem localmente (por ID ou hash)
    for (const cloudMatch of cloudMatches) {
      const hash = generateMatchHash(cloudMatch)
      const existsById = localIds.has(cloudMatch.id)
      const existsByHash = localHashes.has(hash)
      
      if (!existsById && !existsByHash) {
        try {
          const { saveMatch: saveLocalMatch } = await import('./match-storage')
          saveLocalMatch(cloudMatch)
          synced++
          console.log(`[SYNC] Partida ${cloudMatch.id} baixada da nuvem`)
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:180',message:'match downloaded from cloud',data:{matchId:cloudMatch.id,hash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
          }
          // #endregion
        } catch (error: any) {
          const errorMsg = `Erro ao baixar partida ${cloudMatch.id}: ${error.message}`
          errors.push(errorMsg)
          console.error('[SYNC]', errorMsg, error)
        }
      } else {
        console.log(`[SYNC] Partida ${cloudMatch.id} já existe localmente (ID ou hash), pulando...`)
      }
    }

    // 2. Enviar partidas locais que não existem na nuvem (por ID ou hash)
    for (const localMatch of localMatches) {
      const hash = generateMatchHash(localMatch)
      const existsInCloudById = cloudIds.has(localMatch.id)
      const existsInCloudByHash = cloudHashes.has(hash)
      
      // Verificar se é uma partida local nova (ID começa com "match_")
      const isLocalOnly = localMatch.id.startsWith('match_')
      
      if (!existsInCloudById && !existsInCloudByHash && isLocalOnly) {
        try {
          const result = await saveMatch(localMatch)
          if (result.success && result.data && result.data[0]) {
            // Atualizar ID local com o ID do Supabase
            const cloudId = result.data[0].id
            const { saveMatch: saveLocalMatch } = await import('./match-storage')
            const updatedMatch = { ...localMatch, id: cloudId }
            saveLocalMatch(updatedMatch)
            uploaded++
            console.log(`[SYNC] Partida ${localMatch.id} enviada para nuvem (novo ID: ${cloudId})`)
            // #region agent log
            if (typeof window !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:210',message:'match uploaded to cloud',data:{oldId:localMatch.id,newId:cloudId,hash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
            }
            // #endregion
          } else {
            // Se falhou, adicionar à fila
            await syncQueue.enqueue('match', localMatch)
            uploaded++
            console.log(`[SYNC] Partida ${localMatch.id} adicionada à fila de sincronização`)
          }
        } catch (error: any) {
          const errorMsg = `Erro ao enviar partida ${localMatch.id}: ${error.message}`
          errors.push(errorMsg)
          console.error('[SYNC]', errorMsg, error)
          // Tentar adicionar à fila
          try {
            await syncQueue.enqueue('match', localMatch)
          } catch (queueError) {
            console.error('[SYNC] Erro ao adicionar à fila:', queueError)
          }
        }
      }
    }

    console.log(`[SYNC] Sincronização concluída: ${synced} baixada(s), ${uploaded} enviada(s), ${errors.length} erro(s)`)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:230',message:'bidirectional sync completed',data:{synced,uploaded,errors:errors.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion

    return { synced, uploaded, errors }
  } catch (error: any) {
    console.error('[SYNC] Erro na sincronização:', error)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:238',message:'sync failed',data:{error:error.message,errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SYNC'})}).catch(()=>{});
    }
    // #endregion
    return { synced, uploaded, errors: [error.message || 'Erro desconhecido'] }
  }
}

export async function saveMatch(matchData: any) {
  try {
    // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de salvar na nuvem
    const userHasAccess = await hasAccess()
    if (!userHasAccess) {
      return { 
        success: false, 
        error: 'Assinatura necessária para sincronizar dados na nuvem. Apenas salvamento local é permitido.' 
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Faça login para salvar.')

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        user_id: user.id,
        data: matchData,
        status: 'finished'
      }])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    console.error('Erro:', error)
    
    // Se falhar, adicionar à fila de sincronização
    if (navigator.onLine) {
      try {
        await syncQueue.enqueue('match', matchData)
        console.log('[SYNC] Partida adicionada à fila de sincronização')
      } catch (queueError) {
        console.error('[SYNC] Erro ao adicionar à fila:', queueError)
      }
    }
    
    return { success: false, error: error.message }
  }
}

/**
 * Salva partida usando a fila de sincronização (para uso offline)
 * ⚠️ PROTEGIDO: Requer assinatura para sincronizar com nuvem
 */
export async function saveMatchWithQueue(matchData: any) {
  try {
    // VERIFICAÇÃO CRÍTICA: Verificar assinatura ANTES de tentar sincronizar
    const userHasAccess = await hasAccess()
    
    if (!userHasAccess) {
      // Usuário sem assinatura - apenas permitir salvamento local
      console.warn('[SYNC] Usuário sem assinatura. Apenas salvamento local é permitido.')
      return { 
        success: false, 
        queued: false,
        error: 'Assinatura necessária para sincronizar com a nuvem. Apenas salvamento local está disponível no período de teste.' 
      }
    }
    
    // Usuário com assinatura - tentar salvar na nuvem
    const result = await saveMatch(matchData)
    if (result.success) {
      return result
    }
    
    // Se falhar, adicionar à fila
    await syncQueue.enqueue('match', matchData)
    return { success: true, queued: true, message: 'Partida adicionada à fila de sincronização' }
  } catch (error: any) {
    // Se tudo falhar, adicionar à fila mesmo assim
    await syncQueue.enqueue('match', matchData)
    return { success: true, queued: true, message: 'Partida adicionada à fila de sincronização' }
  }
}

/**
 * Deleta uma partida do Supabase
 */
export async function deleteMatchFromCloud(matchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[DELETE] Usuário não autenticado, não é possível deletar da nuvem')
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:340',message:'user not authenticated for delete',data:{matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      }
      // #endregion
      return { success: false, error: 'Usuário não autenticado' }
    }

    console.log('[DELETE] Deletando partida do Supabase:', matchId)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:350',message:'deleting match from cloud',data:{matchId,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
    }
    // #endregion

    // Verificar se o ID é um UUID do Supabase (formato UUID)
    const isSupabaseId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)
    
    if (!isSupabaseId) {
      console.log('[DELETE] ID não é do Supabase, pulando deleção na nuvem:', matchId)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:360',message:'match id not from supabase, skipping cloud delete',data:{matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      }
      // #endregion
      return { success: true } // Partida local apenas, não precisa deletar da nuvem
    }

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
      .eq('user_id', user.id) // Garantir que só deleta partidas do próprio usuário

    if (error) {
      console.error('[DELETE] Erro ao deletar do Supabase:', error)
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:375',message:'error deleting from cloud',data:{matchId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
      }
      // #endregion
      throw error
    }

    console.log('[DELETE] Partida deletada do Supabase com sucesso:', matchId)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:383',message:'match deleted from cloud successfully',data:{matchId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
    }
    // #endregion

    return { success: true }
  } catch (error: any) {
    console.error('[DELETE] Erro ao deletar partida do Supabase:', error)
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:390',message:'delete from cloud failed',data:{matchId,error:error.message,errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'DELETE'})}).catch(()=>{});
    }
    // #endregion
    return { success: false, error: error.message || 'Erro desconhecido' }
  }
}