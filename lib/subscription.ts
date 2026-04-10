import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none'
export type SubscriptionPlatform = 'ios' | 'android' | 'web'

export interface Subscription {
  id: string
  user_id: string
  status: SubscriptionStatus
  platform: SubscriptionPlatform | null
  product_id: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  store_transaction_id: string | null
  raw_receipt: any | null
  created_at: string
  updated_at: string
}

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/f7ac993c-ac4d-49fa-92ea-ef3d80ad4032'
const logDebug = (location: string, message: string, data: any = {}) => {
  if (typeof window === 'undefined') return
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data: { ...data, userAgent: navigator.userAgent, platform: typeof Capacitor !== 'undefined' ? Capacitor.getPlatform() : 'web' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    })
  }).catch(() => {})
}
// #endregion

/**
 * Verifica se o usuário tem acesso (trial ativo ou assinatura ativa)
 * IMPORTANTE: Consulta o backend, nunca decide localmente
 */
export async function hasAccess(): Promise<boolean> {
  // #region agent log
  logDebug('lib/subscription.ts:hasAccess', 'Checking access')
  // #endregion
  try {
    const { data: { user } } = await supabase.auth.getUser()
    // #region agent log
    logDebug('lib/subscription.ts:hasAccess', 'User check', { hasUser: !!user, userId: user?.id })
    // #endregion
    if (!user) return false

    // Consultar backend (Edge Function)
    // O backend é a única fonte de verdade
    // #region agent log
    logDebug('lib/subscription.ts:hasAccess', 'Invoking subscription-status Edge Function')
    // #endregion
    const { data, error } = await supabase.functions.invoke('subscription-status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    })

    if (error) {
      // #region agent log
      logDebug('lib/subscription.ts:hasAccess', 'Edge Function error', { error: error.message, errorStatus: error.status })
      // #endregion
      console.error('[SUBSCRIPTION] Erro ao consultar backend:', error)
      return false
    }

    // #region agent log
    logDebug('lib/subscription.ts:hasAccess', 'Edge Function success', { hasAccess: data?.hasAccess })
    // #endregion
    return data?.hasAccess ?? false
  } catch (error: any) {
    // #region agent log
    logDebug('lib/subscription.ts:hasAccess', 'Exception in hasAccess', { error: error?.message, errorStack: error?.stack })
    // #endregion
    console.error('[SUBSCRIPTION] Erro ao verificar acesso:', error)
    return false
  }
}

/**
 * Obtém a assinatura do usuário
 * Consulta o backend para garantir dados atualizados
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Consultar backend primeiro (fonte de verdade)
    const { data: statusData, error: statusError } = await supabase.functions.invoke('subscription-status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    })

    if (!statusError && statusData?.subscription) {
      return statusData.subscription
    }

    // Fallback: consultar diretamente (caso Edge Function não esteja disponível)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[SUBSCRIPTION] Erro ao buscar assinatura:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('[SUBSCRIPTION] Erro ao buscar assinatura:', error)
    return null
  }
}

/**
 * OBSOLETO: Trial é iniciado automaticamente pelo trigger no banco
 * Quando o usuário é criado, o trigger handle_new_user() cria o trial
 * Esta função não deve ser usada - o backend controla tudo
 */

/**
 * OBSOLETO: Verificação de status deve ser feita pelo backend
 * Use hasAccess() que consulta a Edge Function
 * Esta função não deve ser usada - o backend decide tudo
 */

/**
 * OBSOLETO: Status é atualizado pelo backend via webhooks e validações
 * Esta função não deve ser usada - o backend controla tudo
 */

/**
 * OBSOLETO: Assinatura é ativada pelo backend após validação
 * Use as Edge Functions validate-android ou validate-ios
 * Esta função não deve ser usada - o backend controla tudo
 */

/**
 * Obtém dias restantes do trial
 */
export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!subscription || !subscription.trial_ends_at) return 0

  const now = new Date()
  const trialEnd = new Date(subscription.trial_ends_at)
  const diff = trialEnd.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  return Math.max(0, days)
}

/**
 * Obtém dias restantes da assinatura
 */
export function getSubscriptionDaysRemaining(subscription: Subscription | null): number {
  if (!subscription || !subscription.current_period_end) return 0

  const now = new Date()
  const subEnd = new Date(subscription.current_period_end)
  const diff = subEnd.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  return Math.max(0, days)
}

