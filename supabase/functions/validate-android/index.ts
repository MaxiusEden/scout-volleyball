// @ts-nocheck
// Edge Function: POST /validate-android
// Valida recibo do Google Play e atualiza assinatura
// IMPORTANTE: Configure GOOGLE_PLAY_SERVICE_ACCOUNT_KEY no Supabase

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

    const { purchaseToken, productId } = await req.json()

    if (!purchaseToken || !productId) {
      return new Response(
        JSON.stringify({ error: 'purchaseToken e productId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar com Google Play Developer API
    const serviceAccountKey = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      console.warn('[WARNING] GOOGLE_PLAY_SERVICE_ACCOUNT_KEY não configurado - usando validação simulada')
      // Validação simulada para desenvolvimento
      const validationResult = {
        valid: true,
        purchaseState: 0, // 0 = purchased
        expiryTimeMillis: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias
      }

      if (!validationResult.valid || validationResult.purchaseState !== 0) {
        return new Response(
          JSON.stringify({ error: 'Recibo inválido ou compra não confirmada', success: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Atualizar assinatura no banco
      const currentPeriodEnd = new Date(validationResult.expiryTimeMillis).toISOString()

      // CORRIGIDO: Usar supabaseAdmin para bypass de RLS (igual ao caminho de produção)
      const { data: subscription, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          status: 'active',
          platform: 'android',
          product_id: productId,
          store_transaction_id: purchaseToken,
          current_period_end: currentPeriodEnd,
          raw_receipt: { purchaseToken, productId, validatedAt: new Date().toISOString() },
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
    }

    // Validação real com Google Play Developer API
    try {
      const packageName = 'com.vscout.app'

      // Fazer requisição para Google Play Developer API
      const accessToken = await getGoogleAccessToken(serviceAccountKey)

      const response = await fetch(
        `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[VALIDATE-ANDROID] Google Play API error:', errorData)
        return new Response(
          JSON.stringify({ error: 'Falha na validação com Google Play: ' + (errorData.error?.message || 'Desconhecido'), success: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const validationResult = await response.json()

      // Verificar se a compra é válida
      // Em assinaturas da Google Play, purchaseState muitas vezes não está presente (apenas em InApp).
      // Usaremos o fato de que a chamada foi bem sucedida e verificaremos a expiry date depois.
      if (validationResult.purchaseState !== undefined && validationResult.purchaseState !== 0) { // 0 = purchased
        return new Response(
          JSON.stringify({ error: 'Compra não está em estado válido (Cancelada/Reembolsada)', success: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calcular data de expiração para assinaturas
      let currentPeriodEnd: string
      if (validationResult.expiryTimeMillis) {
        currentPeriodEnd = new Date(parseInt(validationResult.expiryTimeMillis)).toISOString()
      } else {
        // Para compras únicas, definir uma data futura longa
        currentPeriodEnd = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString() // 1 ano
      }

      // Atualizar assinatura no banco (usando admin client para bypass de RLS)
      const { data: subscription, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          status: 'active',
          platform: 'android',
          product_id: productId,
          store_transaction_id: purchaseToken,
          current_period_end: currentPeriodEnd,
          raw_receipt: { purchaseToken, productId, validatedAt: new Date().toISOString() },
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
    } catch (validationError: any) {
      console.error('[VALIDATE-ANDROID] Erro na validação:', validationError)
      return new Response(
        JSON.stringify({ error: 'Erro na validação com Google Play ' + (validationError.message || ''), success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: any) {
    console.error('[VALIDATE-ANDROID] Erro:', error)
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Função auxiliar para obter access token do Google
import { importPKCS8, SignJWT } from 'https://deno.land/x/jose@v4.14.4/index.ts'

// Função auxiliar para obter access token do Google
async function getGoogleAccessToken(serviceAccountKey: string): Promise<string> {
  try {
    const keyData = JSON.parse(serviceAccountKey)
    const scope = 'https://www.googleapis.com/auth/androidpublisher'

    const pkcs8 = await importPKCS8(keyData.private_key, 'RS256')

    const jwt = await new SignJWT({
      scope: scope,
      aud: 'https://oauth2.googleapis.com/token'
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(keyData.client_email)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(pkcs8)

    // Trocar JWT por Access Token
    const params = new URLSearchParams()
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
    params.append('assertion', jwt)

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    })

    const data = await response.json()
    if (data.access_token) {
      return data.access_token
    } else {
      throw new Error('Falha ao obter access token: ' + JSON.stringify(data))
    }
  } catch (error) {
    console.error('Erro ao gerar token:', error)
    throw error
  }
}
