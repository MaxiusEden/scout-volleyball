// @ts-nocheck
// Edge Function: GET /subscription-status
// Retorna o status atual da assinatura do usuário
// O app consulta este endpoint para saber se tem acesso

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obter usuário autenticado
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Buscar assinatura do usuário
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      throw subError
    }

    // Se não existe assinatura, criar trial
    if (!subscription) {
      const { data: newSub } = await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: user.id,
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({
          hasAccess: true,
          status: 'trial',
          subscription: newSub,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verificar se tem acesso
    const now = new Date()
    let hasAccess = false
    let effectiveStatus = subscription.status

    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (now < trialEnd) {
        hasAccess = true
      } else {
        // Trial expirado
        effectiveStatus = 'expired'
        hasAccess = false
        // Atualizar status no banco
        await supabaseClient
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id)
      }
    } else if (subscription.status === 'active' && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end)
      if (now < periodEnd) {
        hasAccess = true
      } else {
        // Assinatura expirada
        effectiveStatus = 'expired'
        hasAccess = false
        await supabaseClient
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id)
      }
    } else if (subscription.status === 'active') {
      hasAccess = true
    }

    return new Response(
      JSON.stringify({
        hasAccess,
        status: effectiveStatus,
        subscription: {
          ...subscription,
          status: effectiveStatus,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

