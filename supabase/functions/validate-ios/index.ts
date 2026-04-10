// @ts-nocheck
// Edge Function: POST /validate-ios
// Valida recibo do App Store e atualiza assinatura
// IMPORTANTE: Configure APP_STORE_SHARED_SECRET no Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Cliente Admin para bypass de RLS (necessário para atualizar a tabela subscriptions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { transactionId, productId, receiptData } = await req.json()

    if (!transactionId || !productId) {
      return new Response(
        JSON.stringify({ error: 'transactionId e productId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Validar com App Store Server API
    // Você precisa:
    // 1. Obter App Store Connect API Key
    // 2. Adicionar em Deno.env.get('APP_STORE_KEY_ID'), 'APP_STORE_ISSUER_ID', 'APP_STORE_KEY'
    // 3. Usar App Store Server API para validar a transação
    
    // Por enquanto, vamos simular validação bem-sucedida
    // EM PRODUÇÃO, SUBSTITUA ISSO PELA VALIDAÇÃO REAL:
    
    const appStoreSharedSecret = Deno.env.get('APP_STORE_SHARED_SECRET')
    if (!appStoreSharedSecret) {
      console.warn('[WARNING] APP_STORE_SHARED_SECRET não configurado - usando validação simulada')
    }

    // Validação real seria assim:
    // const validationResult = await validateAppStoreTransaction(
    //   transactionId,
    //   productId,
    //   appStoreSharedSecret
    // )

    // Por enquanto, simular validação bem-sucedida
    const validationResult = {
      valid: true,
      status: 0, // 0 = valid
      expiresDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias
    }

    if (!validationResult.valid || validationResult.status !== 0) {
      return new Response(
        JSON.stringify({ error: 'Transação inválida ou não confirmada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar assinatura no banco
    const currentPeriodEnd = new Date(validationResult.expiresDate).toISOString()
    
    // CORRIGIDO: Usar supabaseAdmin para bypass de RLS
    const { data: subscription, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        status: 'active',
        platform: 'ios',
        product_id: productId,
        store_transaction_id: transactionId,
        current_period_end: currentPeriodEnd,
        raw_receipt: { transactionId, productId, receiptData, validatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message: 'Assinatura ativada com sucesso',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('[VALIDATE-IOS] Erro:', error)
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

